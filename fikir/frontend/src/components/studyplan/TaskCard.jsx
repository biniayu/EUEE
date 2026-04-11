import { useState } from 'react';
import { accentForSubject } from './subjectAccent.js';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TaskCard({ task, onComplete, onMoveDay, onDurationChange, busy }) {
  const [dur, setDur] = useState(String(task.durationMinutes));
  const acc = accentForSubject(task.subjectName);
  const typeLabel =
    task.taskType === 'mock'
      ? 'Mock exam'
      : task.taskType === 'practice'
        ? 'Practice'
        : task.taskType === 'review'
          ? 'Review'
          : 'Lesson';

  async function saveDuration() {
    const n = Math.round(Number(dur));
    if (!Number.isFinite(n) || n === task.durationMinutes) return;
    await onDurationChange(task.id, n);
  }

  return (
    <div
      className={`rounded-xl border ${acc.border} ${acc.bg} p-3 shadow-sm transition hover:shadow-md`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${acc.chip}`}>
            {task.subjectName}
          </span>
          <p className="mt-2 text-sm font-semibold text-deep-blue">{task.title}</p>
          <p className="mt-0.5 text-xs text-neutral-600">
            {typeLabel} · {task.day}
          </p>
        </div>
        {task.completed && (
          <span className="shrink-0 rounded-full bg-brand-emerald/15 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-emerald">
            Done
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-2 border-t border-white/60 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-xs text-neutral-600">
          <span className="font-semibold text-deep-blue">Minutes</span>
          <input
            type="number"
            min={15}
            max={180}
            disabled={task.completed || busy}
            value={dur}
            onChange={(e) => setDur(e.target.value)}
            onBlur={saveDuration}
            className="w-20 rounded-lg border border-neutral-200 px-2 py-1 text-xs font-medium disabled:opacity-50"
          />
        </label>

        <label className="flex items-center gap-2 text-xs text-neutral-600">
          <span className="font-semibold text-deep-blue">Day</span>
          <select
            value={task.day}
            disabled={task.completed || busy}
            onChange={(e) => onMoveDay(task.id, e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-deep-blue disabled:opacity-50"
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!task.completed && (
        <button
          type="button"
          disabled={busy}
          onClick={() => onComplete(task.id)}
          className="mt-3 w-full rounded-lg bg-deep-blue py-2 text-xs font-semibold text-white transition hover:bg-[#002a52] disabled:opacity-50"
        >
          Mark complete
        </button>
      )}
    </div>
  );
}
