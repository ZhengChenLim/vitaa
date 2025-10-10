'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import InteractiveChatBotLauncher from '@/components/InteractiveChatBotLauncher';
import {
  X,
  Maximize,
  Minimize2,
  ArrowRight,
  Loader2,
  RotateCw,
  Copy as CopyIcon,
  User,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// OPTIONAL (shadcn): comment these 3 lines if you’re not using shadcn/ui Avatar
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

type Msg = { role: 'assistant' | 'user'; content: string; reasoning?: string | null };

function RobotAvatar({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={`${className} shrink-0 drop-shadow-sm`}
    >
      <defs>
        <linearGradient id="gBodyMini" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#b9f3d5" />
          <stop offset="50%" stopColor="#5eead4" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>
      {/* Antenna */}
      <g transform="translate(50,18)">
        <rect x={-12} y={6} width={24} height={10} rx={5} fill="#7ce3c5" />
        <line x1={0} y1={0} x2={0} y2={6} stroke="#55d3a9" strokeWidth={4} />
        <circle cx={0} cy={-4} r={5} fill="#fdf718" />
      </g>
      {/* Head */}
      <g transform="translate(50,56)">
        <rect x={-44} y={-30} width={88} height={60} rx={28} fill="url(#gBodyMini)" />
        <path d="M30,-18 C40,-24 46,-18 38,-10" fill="#eafff6" opacity="0.85" />
        <circle cx={36} cy={-20} r={4} fill="#eafff6" opacity="0.95" />
        <rect x={-32} y={-14} width={64} height={28} rx={14} fill="#0a1220" />
        <circle cx={-14} cy={0} r={7} fill="#0ea5e9" />
        <circle cx={14} cy={0} r={7} fill="#0ea5e9" />
        <circle cx={-12} cy={-2} r={3} fill="#e2f7ff" />
        <circle cx={16} cy={-2} r={3} fill="#e2f7ff" />
        <path d="M-10,12 Q0,20 10,12" stroke="#16a34a" strokeWidth={4} fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function ChatPanel({
  open,
  onClose,
  messages,
  onSend,
  pending,
  onRefresh,
  onRegenerate, // NEW
}: {
  open: boolean;
  onClose: () => void;
  messages: Msg[];
  onSend: (text: string) => void;
  pending: boolean;
  onRefresh: () => void;
  onRegenerate: (assistantIndex: number) => void; // NEW
}) {
  const [text, setText] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [isSmall, setIsSmall] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const latestAssistantRef = useRef<HTMLDivElement | null>(null); // NEW

  // Frequently-asked quick replies (chips)
  const chips = [
    'Where can I find NCD articles?',
    'How do I start a Health Plan?',
    'Where is the Health Analysis?',
    'What does BMI mean here?',
    'How do monthly challenges work?',
  ];

  // You can change this to your signed-in user photo if you have it
  const userAvatarUrl = 'https://api.dicebear.com/9.x/thumbs/svg?seed=you'; // placeholder
  const userAvatarFallback = 'You';

  // --- HOOKS MUST ALWAYS RUN IN THE SAME ORDER ---
  // 1) media-query watcher
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const onChange = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsSmall('matches' in e ? e.matches : (e as MediaQueryList).matches);
    onChange(mq);
    mq.addEventListener?.('change', onChange as (e: MediaQueryListEvent) => void);
    return () => mq.removeEventListener?.('change', onChange as (e: MediaQueryListEvent) => void);
  }, []);

  // 2) collapse expanded on very small screens
  useEffect(() => {
    if (isSmall && expanded) setExpanded(false);
  }, [isSmall, expanded]);

  // 3) keep scrolled to bottom on updates
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [open, messages.length, expanded, pending]);

  // 4) AUTO-EXPAND EFFECT (moved ABOVE any conditional returns)
  useEffect(() => {
    if (!open || isSmall || expanded) return;
    const el = latestAssistantRef.current;
    if (!el) return;

    const hasOverflow = () => {
      if (el.scrollWidth > el.clientWidth + 2) return true;
      const wideChild = Array.from(el.querySelectorAll<HTMLElement>('pre, table, blockquote'))
        .some((n) => n.scrollWidth > el.clientWidth + 2);
      return wideChild;
    };

    if (hasOverflow()) {
      setExpanded(true);
      return;
    }

    const ro = new ResizeObserver(() => {
      if (!expanded && hasOverflow()) setExpanded(true);
    });
    ro.observe(el);
    el.querySelectorAll('pre, table, img').forEach((node) => ro.observe(node));

    return () => ro.disconnect();
  }, [open, messages, pending, isSmall, expanded]);

  // -------------------------------------------------
  // No hooks below this line; safe to early-return.
  // -------------------------------------------------

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const v = text.trim();
    if (!v || pending) return;
    onSend(v);
    setText('');
  };

  const handleChipClick = (q: string) => {
    if (pending) return;
    onSend(q);
  };

  const handleCopy = async (str: string) => {
    try {
      await navigator.clipboard.writeText(str ?? '');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = str ?? '';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  };

  if (!open) return null;

  // Find the latest (most recent) user message index
  const lastUserIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === 'user') return i;
    }
    return -1;
  })();

  const lastAssistantIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === 'assistant') return i;
    }
    return -1;
  })();

  return (
    <div className="fixed z-[70] bottom-6 right-6">
      <div
        className={[
          'rounded-2xl shadow-2xl border border-gray-300 transition-all bg-gradient-to-tr from-white via-emerald-50 to-emerald-100 flex flex-col',
          expanded
            ? 'w-[min(96vw,1720px)] h-[min(86vh,1080px)] origin-bottom-right'
            : 'w-[min(92vw,380px)] h-[500px] origin-bottom-right',
          'flex flex-col',
        ].join(' ')}
        role="dialog"
        aria-label="Vivi chatbot"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between py-1 px-3 border-b">
          <div className="flex items-center gap-2">
            <svg width="56" height="56" viewBox="0 0 130 100" className="drop-shadow-sm" aria-hidden="true">
              <defs>
                <linearGradient id="gBody" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#b9f3d5" />
                  <stop offset="50%" stopColor="#5eead4" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
              {/* Antenna */}
              <g transform="translate(80,18)">
                <rect x={-12} y={6} width={24} height={10} rx={5} fill="#7ce3c5" />
                <line x1={0} y1={0} x2={0} y2={6} stroke="#55d3a9" strokeWidth={4} />
                <circle cx={0} cy={-4} r={5} fill="#fdf718" />
              </g>
              {/* Head */}
              <g transform="translate(80,56)">
                <rect x={-44} y={-30} width={88} height={60} rx={28} fill="url(#gBody)" />
                <path d="M30,-18 C40,-24 46,-18 38,-10" fill="#eafff6" opacity="0.85" />
                <circle cx={36} cy={-20} r={4} fill="#eafff6" opacity="0.95" />
                <rect x={-32} y={-14} width={64} height={28} rx={14} fill="#0a1220" />
                <circle cx={-14} cy={0} r={7} fill="#0ea5e9" />
                <circle cx={14} cy={0} r={7} fill="#0ea5e9" />
                <circle cx={-12} cy={-2} r={3} fill="#e2f7ff" />
                <circle cx={16} cy={-2} r={3} fill="#e2f7ff" />
                <path d="M-10,12 Q0,20 10,12" stroke="#16a34a" strokeWidth={4} fill="none" strokeLinecap="round" />
              </g>
            </svg>
            <div className="flex flex-col leading-tight">
              <div className="text-base font-semibold">Vivi</div>
              <div className="text-xs text-slate-500">Your AI assistant</div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Refresh */}
            <button
              type="button"
              className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-slate-100 disabled:opacity-50"
              onClick={onRefresh}
              aria-label="Refresh"
              disabled={pending}
              title="Reset conversation"
            >
              <RotateCw className="h-4 w-4" />
            </button>

            {!isSmall && (
              <button
                type="button"
                className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-slate-100"
                onClick={() => setExpanded((e) => !e)}
                aria-label={expanded ? 'Collapse' : 'Expand'}
              >
                {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </button>
            )}
            <button
              type="button"
              className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-slate-100"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="pt-0 flex-1 flex flex-col min-h-0">
          <div
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-y-auto rounded-none bg-white/80 backdrop-blur-sm"
          >
            <div className="p-4 space-y-2">
              {messages.map((m, idx) => {
                const isAssistant = m.role === 'assistant';
                const isUser = m.role === 'user';
                const isThinking = isAssistant && (!m.content || m.content.length === 0);
                const isLastAssistant = isAssistant && idx === messages.length - 1;
                const isLatestAssistant = isAssistant && idx === lastAssistantIdx;
                // Is this the latest user prompt?
                const isLatestUserPrompt = isUser && idx === lastUserIdx;

                // Wrapper alignment
                const wrapperClasses = isUser ? 'justify-end' : 'justify-start';

                // Bubble base classes — UPDATED
                const bubbleBase = [
                  'max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm',
                  // Markdown-friendly wrapping/scrolling
                  'break-words whitespace-pre-wrap',
                  // long tokens/links
                  '[&_a]:break-all',
                  // inline code wrap
                  '[&_code]:break-words',
                  // code blocks scroll and smaller font
                  '[&_pre]:overflow-x-auto [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:text-xs',
                  // wide tables/images scroll within bubble
                  '[&_table]:block [&_table]:overflow-x-auto',
                  '[&_img]:max-w-full',
                  // compact headings in bubbles
                  'prose prose-sm max-w-none'
                ].join(' ');

                const assistantPalette =
                  'bg-gradient-to-br from-emerald-50 via-teal-50 to-lime-50 text-black border border-gray-200 hover:ring-1 hover:ring-purple-300/60';
                const userPalette =
                  'bg-gradient-to-br from-indigo-500 via-blue-500 to-sky-400 text-white border border-gray-200 prose-invert hover:ring-1 hover:ring-blue-300/40';

                // --- Latest user prompt: add avatar to the right
                if (isLatestUserPrompt) {
                  return (
                    <div key={idx} className={`flex ${wrapperClasses}`}>
                      <div className="flex items-end gap-2">
                        <div className={`${bubbleBase} ${userPalette}`}>
                          <div className="space-y-2">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {m.content}
                            </ReactMarkdown>
                          </div>
                        </div>

                        {/* Right-side avatar for the most recent user prompt */}
                        <div className="shrink-0">
                          <div className="h-7 w-7 flex items-center justify-center rounded-full bg-sky-600 text-white">
                            <User className="h-4 w-4" />
                          </div>
                          {/* shadcn Avatar */}
                          {/* <Avatar className="h-7 w-7 ring-1 ring-slate-200">
                            <AvatarImage src={userAvatarUrl} alt="You" />
                            <AvatarFallback className="text-[10px]">{userAvatarFallback}</AvatarFallback>
                          </Avatar> */}
                        </div>
                      </div>
                    </div>
                  );
                }

                // --- Assistant message while reasoning/streaming: show robot + skeleton
                if (isAssistant && isThinking) {
                  return (
                    <div key={idx} className="flex justify-start">
                      <div className="flex items-start gap-2">
                        {isLatestAssistant && <RobotAvatar className="h-7 w-7" />}
                        <div className={[bubbleBase, assistantPalette].join(' ')} aria-live="polite">
                          <div className="flex items-start gap-2">
                            <Loader2 className="h-4 w-4 mt-0.5 animate-spin" />
                            <div className="flex-1">
                              <div className="font-medium">Thinking…</div>
                              {m.reasoning && m.reasoning.length > 0 && (
                                <details className="mt-1 text-[10px] opacity-90">
                                  <summary className="cursor-pointer select-none">Show why</summary>
                                  <div className="mt-1 whitespace-pre-wrap">{m.reasoning}</div>
                                </details>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // --- Assistant message (normal)
                if (isAssistant) {
                  return (
                    <div key={idx} className="flex justify-start">
                      <div className="flex items-start gap-2">
                        {isLatestAssistant && <RobotAvatar className="h-7 w-7" />}
                        <div
                          ref={isLatestAssistant ? latestAssistantRef : undefined}
                          className={[bubbleBase, assistantPalette].join(' ')}
                        >
                          <div className="space-y-2">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>

                            {idx === 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {chips.map((q) => (
                                  <button
                                    key={q}
                                    type="button"
                                    className="px-3 py-1 text-xs rounded-full border border-emerald-200 hover:bg-emerald-50 disabled:opacity-50"
                                    onClick={() => handleChipClick(q)}
                                    disabled={pending}
                                  >
                                    {q}
                                  </button>
                                ))}
                              </div>
                            )}

                            {m.reasoning && m.reasoning.trim() && (
                              <details className="mt-2 text-xs border-t pt-2 opacity-90">
                                <summary className="cursor-pointer select-none">Show reasoning</summary>
                                <div className="mt-1 whitespace-pre-wrap">{m.reasoning}</div>
                              </details>
                            )}

                            <div className="mt-1 flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleCopy(m.content)}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                                title="Copy message"
                                disabled={pending}
                              >
                                <CopyIcon className="h-3.5 w-3.5" />
                              </button>

                              {isLastAssistant && (
                                <button
                                  type="button"
                                  onClick={() => onRegenerate(idx)}
                                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                                  title="Regenerate last response"
                                  disabled={pending}
                                >
                                  <RotateCw className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // --- Other user messages (not the latest): plain right-aligned bubble
                return (
                  <div key={idx} className={`flex ${wrapperClasses}`}>
                    <div className={[bubbleBase, userPalette].join(' ')}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Input row */}
          <form onSubmit={handleSubmit} className="mt-3 flex gap-2 px-2 pb-2 bg-white">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 h-9 rounded-md border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={pending}
            />
            <button
              type="submit"
              className="h-9 w-9 inline-flex items-center justify-center rounded-md bg-sky-600 hover:bg-sky-600/90 text-white disabled:opacity-50"
              aria-label="Send"
              disabled={pending}
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Footer note */}
        <div className="px-3 py-2 border-t">
          <p className="text-[10px] text-slate-700 text-center">
            AI can make mistakes. For critical advice, please consult a human expert.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ChatMount() {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: 'Hi, I’m Vivi! How can I help today?' },
  ]);
  const [pending, setPending] = useState(false);

  // STREAMING CLIENT
  const callLLMStream = async (
    fullMessages: { role: 'user' | 'assistant' | 'system'; content: string }[],
    onDelta: (part: 'content' | 'reasoning', text: string) => void
  ) => {
    const res = await fetch('http://localhost:3000/en/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({ messages: fullMessages }),
    });
    if (!res.ok || !res.body) throw new Error(await res.text().catch(() => '') || `HTTP ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      const events = buf.split('\n\n');
      buf = events.pop() || '';

      for (const evt of events) {
        for (const line of evt.split('\n')) {
          const t = line.trim();
          if (!t.startsWith('data:')) continue;
          const payload = t.slice(5).trim();
          if (payload === '[DONE]') return;
          try {
            const obj = JSON.parse(payload) as {
              type?: string;
              part?: 'content' | 'reasoning';
              text?: string;
              message?: string;
            };
            if (obj.type === 'delta' && obj.text && obj.part) onDelta(obj.part, obj.text);
            if (obj.type === 'error') throw new Error(obj.message || 'stream error');
          } catch {
            /* ignore partials */
          }
        }
      }
    }
  };

  const handleSend = async (text: string) => {
    setMessages((prev) => [...prev, { role: 'user' as const, content: text }]);
    const idx = messages.length + 1; // placeholder index for new assistant
    setMessages((prev) => [...prev, { role: 'assistant' as const, content: '', reasoning: '' }]);

    setPending(true);
    try {
      const transcript = [...messages, { role: 'user' as const, content: text }];

      await callLLMStream(transcript, (part, delta) => {
        setMessages((prev) => {
          const next = [...prev];
          const msg = next[idx];
          if (msg?.role === 'assistant') {
            if (part === 'content') next[idx] = { ...msg, content: (msg.content || '') + delta };
            if (part === 'reasoning') next[idx] = { ...msg, reasoning: (msg.reasoning || '') + delta };
          }
          return next;
        });
      });
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Request failed: ${e?.message || 'unknown'}` },
      ]);
    } finally {
      setPending(false);
    }
  };

  // Reset conversation
  const refreshChat = () => {
    if (pending) return;
    setMessages([{ role: 'assistant', content: 'Hi, I’m Vivi! How can I help today?' }]);
  };

  // Regenerate last assistant response (from the immediately preceding user)
  const regenerateAt = async (assistantIndex: number) => {
    if (pending) return;

    // Find the nearest preceding user message
    let userIdx = -1;
    for (let i = assistantIndex - 1; i >= 0; i--) {
      if (messages[i]?.role === 'user') {
        userIdx = i;
        break;
      }
    }
    if (userIdx === -1) return;

    // Transcript up to the user message (inclusive)
    const transcript = messages.slice(0, userIdx + 1).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Set placeholder at the assistant index and truncate anything after it
    setMessages((prev) => {
      const next = [...prev];
      next[assistantIndex] = { role: 'assistant', content: '', reasoning: '' };
      return next.slice(0, assistantIndex + 1);
    });

    setPending(true);
    try {
      await callLLMStream(transcript, (part, delta) => {
        setMessages((prev) => {
          const next = [...prev];
          const msg = next[assistantIndex];
          if (msg?.role === 'assistant') {
            if (part === 'content') next[assistantIndex] = { ...msg, content: (msg.content || '') + delta };
            if (part === 'reasoning') next[assistantIndex] = { ...msg, reasoning: (msg.reasoning || '') + delta };
          }
          return next;
        });
      });
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Request failed: ${e?.message || 'unknown'}` },
      ]);
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <InteractiveChatBotLauncher onOpenChat={() => setChatOpen(true)} position="bottom-right" />
      <ChatPanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        messages={messages}
        onSend={handleSend}
        pending={pending}
        onRefresh={refreshChat}
        onRegenerate={regenerateAt} // NEW
      />
    </>
  );
}
