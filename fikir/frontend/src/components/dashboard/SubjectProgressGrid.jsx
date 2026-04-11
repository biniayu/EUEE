function scoreTone(pct) {
  if (pct == null || Number.isNaN(pct)) return 'text-neutral-500';
  if (pct >= 65) return 'text-emerald-600';
  if (pct >= 45) return 'text-amber-600';
  return 'text-red-600';
}

function SubjectCard({ subject }) {
  const perf = subject.performancePercent;
  const bar = subject.progressPercent ?? 0;

  return (
    <article className="group flex flex-col rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-brand-emerald/30 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-bold text-deep-blue">{subject.subjectName}</h3>
        <span
          className={`text-sm font-bold ${scoreTone(perf)}`}
          title={perf == null ? 'No practice data yet' : 'Practice accuracy'}
        >
          {perf != null ? `${perf}%` : '—'}
        </span>
      </div>
      <p className="mt-1 text-xs text-neutral-500">Performance (practice)</p>

      <dl className="mt-4 space-y-2 text-sm text-neutral-600">
        <div className="flex justify-between gap-2">
          <dt>Lessons</dt>
          <dd className="font-semibold text-neutral-800">
            {subject.lessonsCompleted}/{subject.lessonsTotal}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Practice attempts</dt>
          <dd className="font-semibold text-neutral-800">{subject.practiceAttempted}</dd>
        </div>
      </dl>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs font-medium text-neutral-500">
          <span>Progress</span>
          <span>{bar}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-deep-blue via-brand-emerald to-brand-amber transition-all duration-500 ease-out group-hover:opacity-95"
            style={{ width: `${bar}%` }}
          />
        </div>
      </div>
    </article>
  );
}

export default function SubjectProgressGrid({ subjects, loading, error, onRetry }) {
  if (loading) {
    return (
      <section>
        <div className="mb-4 h-7 w-56 animate-pulse rounded-lg bg-neutral-200" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-neutral-100" />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50/80 p-5 text-red-800">
        <p className="font-semibold">Subject progress unavailable</p>
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

  return (
    <section>
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-deep-blue">Subject progress</h3>
          <p className="text-sm text-neutral-600">
            Natural Science core + SAT — track lessons and practice performance.
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(subjects || []).map((s) => (
          <SubjectCard key={s.subjectId || s.subjectName} subject={s} />
        ))}
      </div>
    </section>
  );
}
