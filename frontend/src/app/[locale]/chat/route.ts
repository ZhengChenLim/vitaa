// app/(locale)/en/chat/route.ts
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
const N8N_URL = 'https://n8n.tm06.me/webhook/chatbot';

const enc = new TextEncoder();
const dec = new TextDecoder();

const sseLine = (obj: any) => `data: ${JSON.stringify(obj)}\n\n`;
const doneLine = 'data: [DONE]\n\n';

export async function POST(req: NextRequest) {
    try {
        const { messages } = await req.json();
        if (!Array.isArray(messages)) {
            return new Response(JSON.stringify({ error: 'Invalid messages' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const chatInput =
            [...messages].reverse().find((m: any) => m?.role === 'user')?.content ??
            JSON.stringify(messages);

        const upstream = await fetch(N8N_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Accept anything (JSONL comes as text/plain usually)
                Accept: 'text/event-stream, application/json, text/plain, */*',
            },
            body: JSON.stringify({ chatInput }),
        });

        if (!upstream.ok || !upstream.body) {
            const bodyText = await upstream.text().catch(() => '');
            return new Response(
                JSON.stringify({
                    error: 'Upstream webhook failed',
                    status: upstream.status,
                    body: bodyText,
                }),
                { status: 502, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const stream = new ReadableStream({
            async start(controller) {
                const ping = setInterval(() => controller.enqueue(enc.encode(': ping\n\n')), 15000);

                // Helpers
                const emitContent = (text: string) =>
                    controller.enqueue(enc.encode(sseLine({ type: 'delta', part: 'content', text })));
                const emitDone = () => controller.enqueue(enc.encode(doneLine));

                try {

                    if (!upstream.ok || !upstream.body) {
                        const bodyText = await upstream.text().catch(() => '');
                        return new Response(
                            JSON.stringify({
                                error: 'Upstream webhook failed',
                                status: upstream.status,
                                body: bodyText,
                            }),
                            { status: 502, headers: { 'Content-Type': 'application/json' } }
                        );
                    }
                    const reader = upstream.body.getReader();
                    let buffer = '';

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += dec.decode(value, { stream: true });

                        // 1) Handle SSE frames first (split on two newlines)
                        let consumed = 0;
                        const sseFrames = buffer.split('\n\n');
                        if (sseFrames.length > 1) {
                            // keep the last (possibly partial) frame in buffer later
                            const completeFrames = sseFrames.slice(0, -1);
                            for (const frame of completeFrames) {
                                consumed += frame.length + 2; // +2 for the '\n\n' we split on
                                const lines = frame.split('\n').map((l) => l.trim());
                                const dataLines = lines.filter((l) => l.startsWith('data:'));
                                if (dataLines.length) {
                                    for (const dl of dataLines) {
                                        const payload = dl.slice(5).trim();
                                        if (payload === '[DONE]') {
                                            emitDone();
                                            clearInterval(ping);
                                            controller.close();
                                            return;
                                        }
                                        try {
                                            const obj = JSON.parse(payload);
                                            const normalized =
                                                obj?.type === 'delta' &&
                                                    (obj?.part === 'content' || obj?.part === 'reasoning') &&
                                                    typeof obj?.text === 'string'
                                                    ? obj
                                                    : { type: 'delta', part: 'content' as const, text: JSON.stringify(obj) };
                                            controller.enqueue(enc.encode(sseLine(normalized)));
                                        } catch {
                                            emitContent(payload);
                                        }
                                    }
                                }
                            }
                            buffer = buffer.slice(consumed);
                        }

                        // 2) Handle JSONL (newline-delimited JSON objects)
                        //    We only process full lines; keep the last partial line in buffer.
                        const lines = buffer.split('\n');
                        if (lines.length > 1) {
                            const completeLines = lines.slice(0, -1);
                            buffer = lines[lines.length - 1]; // remainder

                            for (const line of completeLines) {
                                const t = line.trim();
                                if (!t) continue;
                                // Try parse JSONL object
                                let obj: any = null;
                                try {
                                    obj = JSON.parse(t);
                                } catch {
                                    // Not JSON: treat as raw text chunk
                                    emitContent(t);
                                    continue;
                                }

                                // Normalize known JSONL shapes from n8n
                                if (obj?.type === 'item' && typeof obj?.content === 'string') {
                                    emitContent(obj.content);
                                    continue;
                                }
                                if (obj?.type === 'end') {
                                    emitDone();
                                    clearInterval(ping);
                                    controller.close();
                                    return;
                                }
                                // Ignore 'begin' or unknown types; or forward as text if useful
                                if (typeof obj === 'object') {
                                    // You can choose to ignore 'begin', or surface metadata as reasoning:
                                    // controller.enqueue(enc.encode(sseLine({ type: 'delta', part: 'reasoning', text: JSON.stringify(obj) })));
                                } else {
                                    emitContent(String(obj));
                                }
                            }
                        }

                        // 3) If neither SSE nor JSONL matched yet, we’re still collecting a partial token—wait for more bytes
                    }

                    // Flush leftovers:
                    const tail = buffer.trim();
                    if (tail) {
                        // Try to parse one last JSONL object; else emit as text
                        try {
                            const obj = JSON.parse(tail);
                            if (obj?.type === 'item' && typeof obj?.content === 'string') {
                                emitContent(obj.content);
                            } else if (obj?.type === 'end') {
                                // fall through to DONE below
                            } else {
                                emitContent(typeof obj === 'string' ? obj : JSON.stringify(obj));
                            }
                        } catch {
                            emitContent(tail);
                        }
                    }

                    emitDone();
                } catch (err) {
                    controller.enqueue(
                        enc.encode(sseLine({ type: 'error', message: (err as Error)?.message ?? 'stream error' }))
                    );
                } finally {
                    clearInterval(ping);
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream; charset=utf-8',
                'Cache-Control': 'no-cache, no-transform',
                Connection: 'keep-alive',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err?.message ?? 'Webhook call failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
