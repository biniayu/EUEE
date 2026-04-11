import { useEffect, useState } from 'react';

const DEFAULT_EXAM = '2026-07-15';

export default function GeneratePlanPanel({ onGenerate, generating, initialExamDate }) {
  const [examDate, setExamDate] = useState(initialExamDate || DEFAULT_EXAM);
  const [hoursPerWeek, setHoursPerWeek] = useState(12);
  const [morning, setMorning] = useState(true);
  const [afternoon, setAfternoon] = useState(true);
  const [evening, setEvening] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!initialExamDate) return;
    const v = String(initialExamDate).slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) setExamDate(v);
  }, [initialExamDate]);

  async function submit(e) {
    e.preventDefault();
    await onGenerate({
      examDate: examDate.trim(),
      hoursPerWeek: Number(hoursPerWeek),
      preferences: {
        morning,
        afternoon,
        evening,
        notes: notes.trim() || undefined,
      },
    });
  }

  return (
    <section className="rounded-2xl border border-deep-blue/15 bg-gradient-to-br from-white via-white to-brand-emerald/5 p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-deep-blue">Generate or refresh your week</h2>
          <p className="mt-1 text-sm text-neutral-600">
            We use your diagnostics, weak areas, and real progress — then save a structured plan you can
            edit anytime.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-6 grid gap-5 md:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
            EUEE exam date
          </label>
          <input
            type="date"
            required
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm font-medium text-deep-blue focus:border-brand-emerald focus:outline-none focus:ring-2 focus:ring-brand-emerald/25"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Hours per week
          </label>
          <input
            type="number"
            min={3}
            max={60}
            required
            value={hoursPerWeek}
            onChange={(e) => setHoursPerWeek(e.target.value)}
            className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm font-medium text-deep-blue focus:border-brand-emerald focus:outline-none focus:ring-2 focus:ring-brand-emerald/25"
          />
        </div>

        <div className="md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Preferred study times</p>
          <div className="mt-3 flex flex-wrap gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-neutral-700">
              <input
                type="checkbox"
                checked={morning}
                onChange={(e) => setMorning(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-brand-emerald focus:ring-brand-emerald"
              />
              Morning
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-neutral-700">
              <input
                type="checkbox"
                checked={afternoon}
                onChange={(e) => setAfternoon(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-brand-emerald focus:ring-brand-emerald"
              />
              Afternoon
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-neutral-700">
              <input
                type="checkbox"
                checked={evening}
                onChange={(e) => setEvening(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-brand-emerald focus:ring-brand-emerald"
              />
              Evening
            </label>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Notes for your advisor (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="e.g. School club Tue/Thu after 4pm — avoid heavy blocks those days"
            className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm text-neutral-800 focus:border-brand-emerald focus:outline-none focus:ring-2 focus:ring-brand-emerald/25"
          />
        </div>

        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={generating}
            className="inline-flex items-center justify-center rounded-full bg-deep-blue px-6 py-3 text-sm font-semibold text-white shadow-md shadow-deep-blue/20 transition hover:bg-[#002a52] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generating ? 'Building your plan…' : 'Generate new plan'}
          </button>
          <p className="text-xs text-neutral-500">
            Regenerating archives your previous active week and replaces tasks.
          </p>
        </div>
      </form>
    </section>
  );
}
