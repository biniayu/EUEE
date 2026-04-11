import { useState } from 'react';

export default function CustomSetModal({ open, onClose, onStart }) {
  const [count, setCount] = useState(10);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  if (!open) return null;

  async function start() {
    setBusy(true);
    setErr(null);
    try {
      await onStart(Math.min(40, Math.max(5, Math.round(Number(count) || 10))));
      onClose();
    } catch (e) {
      setErr(e.message || 'Could not build set');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-deep-blue/50 p-4 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="custom-set-title"
      >
        <h2 id="custom-set-title" className="text-lg font-bold text-deep-blue">
          Create custom set
        </h2>
        <p className="mt-2 text-sm text-neutral-600">
          We will pull random questions matching your current filters (same subject, topic, difficulty, and
          type). Great for a focused drill before class.
        </p>
        <label className="mt-4 block text-xs font-semibold uppercase text-neutral-500">Number of questions</label>
        <input
          type="number"
          min={5}
          max={40}
          value={count}
          onChange={(e) => setCount(e.target.value)}
          className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
        />
        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={start}
            className="rounded-full bg-brand-emerald px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {busy ? 'Loading…' : 'Start set'}
          </button>
        </div>
      </div>
    </div>
  );
}
