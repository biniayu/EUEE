import { createContext, useCallback, useContext, useMemo, useState, memo } from 'react';

const ToastContext = createContext(null);

/**
 * Phase 14: Lightweight toast stack (success / error / info) — no new major deps.
 * Usage: const toast = useToast(); toast.show('Saved!', 'success');
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { show: () => {} };
  return ctx;
}

const STYLES = {
  success: 'border-brand-emerald/40 bg-emerald-50 text-emerald-950',
  error: 'border-red-200 bg-red-50 text-red-950',
  info: 'border-deep-blue/20 bg-deep-blue/5 text-deep-blue',
};

function ToastItem({ id, message, type, onDismiss }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-auto flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${STYLES[type] || STYLES.info}`}
    >
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        className="shrink-0 rounded-lg p-1 text-current opacity-70 transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
        aria-label="Dismiss notification"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

const ToastList = memo(function ToastList({ toasts, onDismiss }) {
  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[200] flex flex-col gap-2 sm:bottom-6 sm:right-6"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} onDismiss={onDismiss} />
      ))}
    </div>
  );
});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message, type = 'info', durationMs = 4200) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    if (durationMs > 0) {
      window.setTimeout(() => dismiss(id), durationMs);
    }
  }, [dismiss]);

  const value = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastList toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
