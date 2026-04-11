export default function PlanSummaryStrip({ summary, plan }) {
  if (!summary || !plan) return null;
  const pct = summary.completionPercent ?? 0;
  const adh = summary.adherenceRate ?? 0;
  const hours = summary.totalPlannedHours ?? 0;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Completion</p>
        <p className="mt-2 text-3xl font-bold text-deep-blue">{pct}%</p>
        <p className="mt-1 text-sm text-neutral-600">
          {summary.completedTasks ?? 0} of {summary.totalTasks ?? 0} tasks done
        </p>
      </div>
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Adherence</p>
        <p className="mt-2 text-3xl font-bold text-brand-emerald">{adh}%</p>
        <p className="mt-1 text-sm text-neutral-600">Minutes completed vs planned this week</p>
      </div>
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Planned load</p>
        <p className="mt-2 text-3xl font-bold text-amber-600">{hours}h</p>
        <p className="mt-1 text-sm text-neutral-600">
          Target {plan.totalHoursPerWeek ?? hours}h / week · Exam {plan.examTargetDate || '—'}
        </p>
      </div>
    </div>
  );
}
