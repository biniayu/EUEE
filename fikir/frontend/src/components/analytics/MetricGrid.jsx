function Card({ label, value, hint, accent }) {
  const border =
    accent === 'emerald'
      ? 'border-brand-emerald/30'
      : accent === 'amber'
        ? 'border-brand-amber/40'
        : 'border-deep-blue/20';
  return (
    <div
      className={`rounded-2xl border ${border} bg-gradient-to-br from-white to-neutral-50/80 p-5 shadow-sm`}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-deep-blue sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}

export default function MetricGrid({ metrics }) {
  const m = metrics || {};
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <Card
        label="Study hours"
        value={m.studyHours != null ? `${m.studyHours}h` : '—'}
        hint="Lessons + timed practice sessions"
        accent="blue"
      />
      <Card
        label="Questions attempted"
        value={m.questionsAttempted ?? 0}
        hint="In selected period"
        accent="blue"
      />
      <Card
        label="Accuracy"
        value={m.accuracyPercent != null ? `${m.accuracyPercent}%` : '—'}
        hint="All attempts in range"
        accent="emerald"
      />
      <Card
        label="Avg. time / question"
        value={
          m.avgTimePerQuestionSeconds != null ? `${Math.round(m.avgTimePerQuestionSeconds)}s` : '—'
        }
        hint="From completed practice tests"
        accent="amber"
      />
      <Card
        label="Momentum subject"
        value={m.mostImprovedSubject || '—'}
        hint="Vs diagnostic or top accuracy"
        accent="emerald"
      />
    </div>
  );
}
