function CircularProgress({ percent, size = 112, stroke = 8 }) {
  const p = Math.min(100, Math.max(0, Number(percent) || 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (p / 100) * c;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-neutral-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-brand-emerald transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-center">
        <span className="block text-2xl font-extrabold text-deep-blue">{p}%</span>
        <span className="text-xs font-medium text-neutral-500">overall</span>
      </span>
    </div>
  );
}

export default function OverviewSection({ data, loading, error, onRetry }) {
  if (loading) {
    return (
      <section className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm">
        <div className="h-6 w-48 animate-pulse rounded-lg bg-neutral-200" />
        <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="h-28 w-full max-w-md animate-pulse rounded-2xl bg-neutral-100" />
          <div className="mx-auto h-28 w-28 animate-pulse rounded-full bg-neutral-100" />
          <div className="h-24 w-full max-w-xs animate-pulse rounded-2xl bg-neutral-100" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-3xl border border-red-200 bg-red-50/80 p-6 text-red-800">
        <p className="font-semibold">Could not load overview</p>
        <p className="mt-1 text-sm">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-full bg-deep-blue px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a2b52]"
        >
          Try again
        </button>
      </section>
    );
  }

  const o = data || {};

  return (
    <section className="overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-md shadow-deep-blue/5 transition hover:shadow-lg">
      <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-emerald">Overview</p>
          <h2 className="mt-2 text-2xl font-extrabold text-deep-blue sm:text-3xl">
            Welcome back, {o.userName || 'Student'}
          </h2>
          <p className="mt-2 max-w-xl text-neutral-600">
            You&apos;re building momentum for the Ethiopian University Entrance Examination. Stay steady —
            small daily wins compound.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-emerald/10 px-4 py-2 text-sm font-semibold text-emerald-900">
            <span aria-hidden>🔥</span>
            {o.streakLabel || 'Start your streak today'}
          </div>
        </div>

        <div className="flex justify-center">
          <CircularProgress percent={o.overallProgressPercent ?? 0} />
        </div>

        <div className="rounded-2xl border border-brand-amber/25 bg-gradient-to-br from-brand-amber/10 to-white p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-900/80">Next exam</p>
          <p className="mt-2 text-lg font-bold text-deep-blue">EUEE</p>
          <p className="mt-1 text-sm text-neutral-600">{o.examCountdownLabel}</p>
          <p className="mt-3 text-xs text-neutral-500">
            Target date: <span className="font-medium text-neutral-700">{o.eueeExamDate}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
