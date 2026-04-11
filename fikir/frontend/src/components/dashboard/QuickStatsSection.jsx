export default function QuickStatsSection({ stats, loading, error, onRetry }) {
  if (loading) {
    return (
      <section className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm">
        <div className="h-6 w-40 animate-pulse rounded-lg bg-neutral-200" />
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-neutral-100" />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-3xl border border-red-200 bg-red-50/80 p-6 text-red-800">
        <p className="font-semibold">Quick stats unavailable</p>
        <p className="mt-1 text-sm">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-full bg-deep-blue px-4 py-2 text-sm font-semibold text-white"
        >
          Retry
        </button>
      </section>
    );
  }

  const s = stats || {};

  return (
    <section className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-bold text-deep-blue">Quick stats</h3>
      <p className="mt-1 text-sm text-neutral-600">This week at a glance — keep the rhythm.</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-neutral-100 bg-gradient-to-br from-deep-blue/5 to-white p-5 transition hover:shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Study hours</p>
          <p className="mt-2 text-3xl font-extrabold text-deep-blue">{s.studyHoursThisWeek ?? 0}</p>
          <p className="mt-1 text-xs text-neutral-500">Hours this week (lessons + estimated practice)</p>
        </div>
        <div className="rounded-2xl border border-neutral-100 bg-gradient-to-br from-brand-emerald/10 to-white p-5 transition hover:shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Accuracy</p>
          <p className="mt-2 text-3xl font-extrabold text-brand-emerald">
            {s.accuracyPercent != null ? `${s.accuracyPercent}%` : '—'}
          </p>
          <p className="mt-1 text-xs text-neutral-500">{s.accuracyLabel}</p>
        </div>
        <div className="rounded-2xl border border-neutral-100 bg-gradient-to-br from-brand-amber/15 to-white p-5 transition hover:shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Momentum</p>
          <p className="mt-2 text-lg font-bold text-deep-blue leading-snug">{s.mostImprovedSubject}</p>
          <p className="mt-1 text-xs text-neutral-500">
            {s.mostImprovedDelta != null
              ? `Up ~${s.mostImprovedDelta}% vs diagnostic baseline (this week’s practice)`
              : 'Practice more subjects to reveal improvement trends'}
          </p>
        </div>
      </div>
    </section>
  );
}
