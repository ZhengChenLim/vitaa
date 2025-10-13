import { NextRequest } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY!,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid messages' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const completion = await client.chat.completions.create({
      model: 'openai/gpt-oss-120b', // or deepseek-ai/deepseek-r1 if you want reasoning deltas
      messages,
      reasoning_effort: 'low',
      temperature: 0.5,
      top_p: 1,
      max_tokens: 1025,
      stream: true,
    });

    const enc = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const choice = chunk.choices?.[0];
            const delta = (choice?.delta ?? {}) as any;

            const reasoningDelta = typeof delta.reasoning_content === 'string' ? delta.reasoning_content : '';
            const contentDelta   = typeof delta.content            === 'string' ? delta.content            : '';

            if (reasoningDelta) {
              controller.enqueue(
                enc.encode(`data: ${JSON.stringify({ type: 'delta', part: 'reasoning', text: reasoningDelta })}\n\n`)
              );
            }
            if (contentDelta) {
              controller.enqueue(
                enc.encode(`data: ${JSON.stringify({ type: 'delta', part: 'content', text: contentDelta })}\n\n`)
              );
            }

            if (choice?.finish_reason) {
              controller.enqueue(enc.encode(`data: [DONE]\n\n`));
            }
          }
        } catch (e) {
          controller.enqueue(
            enc.encode(`data: ${JSON.stringify({ type: 'error', message: String(e) })}\n\n`)
          );
        } finally {
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
    return new Response(JSON.stringify({ error: err?.message ?? 'LLM call failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}