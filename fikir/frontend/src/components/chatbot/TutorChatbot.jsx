import { useCallback, useEffect, useRef, useState } from 'react';
import useAuth from '../../hooks/useAuth.js';
import { useChatbotPageContext } from './ChatbotContext.jsx';
import ChatMarkdown from './ChatMarkdown.jsx';

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5" aria-live="polite" aria-label="Tutor is typing">
      <span className="h-2 w-2 animate-bounce rounded-full bg-brand-emerald/70 [animation-delay:-0.2s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-brand-emerald/70 [animation-delay:-0.1s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-brand-emerald/70" />
    </div>
  );
}

export default function TutorChatbot() {
  const { user, fetchMe } = useAuth();
  const { pageContext } = useChatbotPageContext();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, open, scrollToBottom]);

  useEffect(() => {
    if (!user || !open) return undefined;
    let cancelled = false;
    (async () => {
      setBootstrapping(true);
      try {
        const res = await fetch('/api/chatbot/messages', { credentials: 'include' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || cancelled) return;
        const rows = data.messages || [];
        setMessages(
          rows.map((m) => ({
            id: m.id,
            role: m.isAi ? 'assistant' : 'user',
            content: m.message,
          }))
        );
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, open]);

  useEffect(() => {
    if (!user) {
      setMessages([]);
      setOpen(false);
    }
  }, [user]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading || bootstrapping || !user) return;

    setInput('');
    setMessages((prev) => [...prev, { id: `local-${Date.now()}`, role: 'user', content: text }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: text, context: pageContext }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        const errText =
          data.error || "Sorry, I couldn't respond. Please try again.";
        setMessages((prev) => [
          ...prev,
          { id: `err-${Date.now()}`, role: 'assistant', content: errText, isError: true },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, role: 'assistant', content: data.reply || '' },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: "Sorry, I couldn't respond. Please try again.",
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (!user) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-brand-emerald text-white shadow-lg shadow-brand-emerald/35 ring-2 ring-white transition hover:scale-105 hover:bg-emerald-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-emerald/40 sm:bottom-6 sm:right-6"
        aria-expanded={open}
        aria-label={open ? 'Close tutor chat' : 'Open AI tutor'}
      >
        {open ? (
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l5.89-1.42A9.96 9.96 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        )}
      </button>

      <div
        className={`fixed inset-x-0 bottom-0 z-[99] flex max-h-[85dvh] flex-col rounded-t-3xl border border-neutral-200/90 bg-white shadow-2xl transition-transform duration-300 ease-out sm:inset-auto sm:bottom-24 sm:right-6 sm:max-h-[min(32rem,70vh)] sm:w-[min(100vw-2rem,22rem)] sm:rounded-3xl ${
          open ? 'translate-y-0' : 'pointer-events-none translate-y-[110%] sm:translate-y-8 sm:opacity-0'
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-neutral-100 bg-gradient-to-r from-deep-blue to-[#0a2b52] px-4 py-3 text-white sm:rounded-t-3xl">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-emerald/90">EUEE tutor</p>
            <p className="text-sm font-bold">Ask anything</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 hover:bg-white/10 sm:hidden"
            aria-label="Close chat"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {pageContext && Object.keys(pageContext).length > 0 && (
          <div className="border-b border-neutral-100 bg-brand-emerald/5 px-3 py-2 text-xs text-neutral-600">
            <span className="font-semibold text-deep-blue">Context: </span>
            {pageContext.type === 'lesson' && (
              <>
                Lesson — <span className="font-medium">{pageContext.lessonTitle}</span>
                {pageContext.subjectName && (
                  <>
                    {' '}
                    · <span className="font-medium">{pageContext.subjectName}</span>
                  </>
                )}
              </>
            )}
            {pageContext.type === 'subject' && (
              <>
                Subject — <span className="font-medium">{pageContext.subjectName}</span>
              </>
            )}
            {pageContext.type === 'subjects' && 'All subjects'}
            {pageContext.type === 'dashboard' && 'Dashboard'}
            {pageContext.type === 'practice' && 'Practice test'}
            {pageContext.type === 'analytics' && 'Performance analytics'}
            {pageContext.type === 'study_plan' && 'Study plan generator'}
            {pageContext.type === 'question_bank' && 'Question bank'}
            {pageContext.type === 'past_papers' && 'Past papers'}
            {!['lesson', 'subject', 'subjects', 'dashboard', 'practice', 'analytics', 'study_plan', 'question_bank', 'past_papers'].includes(
              pageContext.type
            ) && JSON.stringify(pageContext)}
          </div>
        )}

        <div
          ref={listRef}
          className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3"
          role="log"
          aria-live="polite"
        >
          {bootstrapping && (
            <p className="rounded-2xl bg-neutral-50 px-3 py-2 text-center text-sm text-neutral-500">
              Loading your conversation…
            </p>
          )}
          {messages.length === 0 && !loading && !bootstrapping && (
            <p className="rounded-2xl bg-neutral-50 px-3 py-2 text-center text-sm text-neutral-500">
              Hi! I&apos;m your EUEE prep tutor. Ask about Math, Physics, Chemistry, Biology, English, or SAT-style
              reasoning.
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[92%] rounded-2xl px-3 py-2 shadow-sm sm:max-w-[88%] ${
                  m.role === 'user'
                    ? 'rounded-br-md bg-deep-blue text-white'
                    : m.isError
                      ? 'rounded-bl-md border border-red-200 bg-red-50 text-red-900'
                      : 'rounded-bl-md border border-neutral-100 bg-neutral-50 text-neutral-900'
                }`}
              >
                {m.role === 'assistant' && !m.isError ? (
                  <ChatMarkdown>{m.content}</ChatMarkdown>
                ) : (
                  <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md border border-neutral-100 bg-neutral-50 px-4 py-3 shadow-sm">
                <TypingIndicator />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-neutral-100 p-3">
          <div className="flex gap-2 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-1.5 focus-within:border-brand-emerald/50 focus-within:ring-2 focus-within:ring-brand-emerald/20">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Type your question…"
              className="max-h-28 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
              disabled={loading || bootstrapping}
              aria-label="Message to tutor"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={loading || bootstrapping || !input.trim()}
              className="shrink-0 rounded-xl bg-brand-emerald px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-neutral-400">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </>
  );
}
