export default function AIRecommendationsSection({ recommendations, loading, error, onRetry }) {
  if (loading) {
    return (
      <section className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm">
        <div className="h-6 w-72 animate-pulse rounded-lg bg-neutral-200" />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-neutral-100" />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-3xl border border-red-200 bg-red-50/80 p-6 text-red-800">
        <p className="font-semibold">Recommendations unavailable</p>
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

  const list = recommendations || [];

  return (
    <section className="rounded-3xl border border-deep-blue/10 bg-gradient-to-br from-deep-blue/[0.03] via-white to-brand-amber/10 p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-brand-amber/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-900">
          AI insights
        </span>
        <h3 className="text-xl font-bold text-deep-blue">Smart recommendations</h3>
      </div>
      <p className="mt-1 text-sm text-neutral-600">
        Based on your weak areas and diagnostic performance — prioritize these next.
      </p>

      {list.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-neutral-200 bg-white/80 px-4 py-6 text-center text-sm text-neutral-600">
          Complete the diagnostic or add weak-area data to unlock personalized suggestions.
        </p>
      ) : (
        <ul className="mt-5 grid gap-4 md:grid-cols-2">
          {list.map((r) => (
            <li
              key={r.id}
              className="flex flex-col rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-emerald">
                {r.subjectName}
              </p>
              <p className="mt-2 text-lg font-bold text-deep-blue">{r.title}</p>
              <p className="mt-2 flex-1 text-sm text-neutral-600">{r.body}</p>
              <button
                type="button"
                className="mt-4 w-full rounded-full border border-deep-blue/20 bg-deep-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0a2b52] sm:w-auto"
              >
                {r.actionLabel || 'Review'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
