export default function TodayTasksSection({ tasks, emptyMessage, loading, error, onRetry }) {
  if (loading) {
    return (
      <section className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm">
        <div className="h-6 w-64 animate-pulse rounded-lg bg-neutral-200" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-neutral-100" />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-3xl border border-red-200 bg-red-50/80 p-6 text-red-800">
        <p className="font-semibold">Today&apos;s tasks failed to load</p>
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

  const list = tasks || [];

  return (
    <section className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-bold text-deep-blue">Today&apos;s recommended tasks</h3>
      <p className="mt-1 text-sm text-neutral-600">Pulled from your active plan or onboarding schedule.</p>

      {list.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-600">
          {emptyMessage || 'No tasks scheduled for today yet.'}
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {list.map((t) => (
            <li
              key={t.id}
              className="flex flex-col gap-3 rounded-2xl border border-neutral-100 bg-gradient-to-r from-white to-brand-emerald/5 p-4 transition hover:border-brand-emerald/25 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-neutral-900">{t.title}</p>
                <p className="mt-1 text-sm text-neutral-500">
                  {t.subjectName}
                  {t.durationMinutes ? ` · ${t.durationMinutes} min` : ''}
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-full bg-deep-blue px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0a2b52] hover:shadow-md active:scale-[0.98]"
              >
                {t.ctaLabel || 'Start'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
