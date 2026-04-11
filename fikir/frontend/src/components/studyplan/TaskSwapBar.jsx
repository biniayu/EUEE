import { useState } from 'react';

export default function TaskSwapBar({ tasks, onSwap, busy }) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');

  if (!tasks || tasks.length < 2) return null;

  async function submit(e) {
    e.preventDefault();
    if (!a || !b || a === b) return;
    await onSwap(Number(a), Number(b));
    setA('');
    setB('');
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Swap two days</p>
        <p className="text-xs text-neutral-600">Exchange schedule slots between two tasks.</p>
      </div>
      <label className="text-xs font-semibold text-deep-blue">
        Task A
        <select
          value={a}
          onChange={(e) => setA(e.target.value)}
          className="mt-1 block w-full min-w-[10rem] rounded-lg border border-neutral-200 bg-white px-2 py-2 text-xs"
        >
          <option value="">Select…</option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.day} · {t.subjectName} · {t.title?.slice(0, 40)}
              {t.title?.length > 40 ? '…' : ''}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-semibold text-deep-blue">
        Task B
        <select
          value={b}
          onChange={(e) => setB(e.target.value)}
          className="mt-1 block w-full min-w-[10rem] rounded-lg border border-neutral-200 bg-white px-2 py-2 text-xs"
        >
          <option value="">Select…</option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.day} · {t.subjectName} · {t.title?.slice(0, 40)}
              {t.title?.length > 40 ? '…' : ''}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={busy || !a || !b || a === b}
        className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-deep-blue shadow-sm hover:bg-amber-400 disabled:opacity-50"
      >
        Swap days
      </button>
    </form>
  );
}
