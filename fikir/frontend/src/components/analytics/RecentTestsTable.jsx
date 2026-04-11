function typeLabel(t) {
  if (t === 'mock') return 'Mock exam';
  if (t === 'topic') return 'Topic practice';
  return 'Subject practice';
}

export default function RecentTestsTable({ items }) {
  const list = items || [];
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold text-deep-blue">Recent practice tests</h3>
      <p className="mt-1 text-sm text-neutral-600">Completed sessions in the selected range.</p>
      {list.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">No completed sessions in this window.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-xs uppercase text-neutral-500">
                <th className="pb-2 pr-2">Type</th>
                <th className="pb-2 pr-2">Score</th>
                <th className="pb-2 pr-2">Questions</th>
                <th className="pb-2">Completed</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} className="border-b border-neutral-100">
                  <td className="py-2.5 font-medium text-neutral-800">{typeLabel(r.sessionType)}</td>
                  <td className="py-2.5">
                    {r.scorePercent != null ? (
                      <span className="font-bold text-brand-emerald">{r.scorePercent}%</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2.5 text-neutral-600">{r.totalQuestions}</td>
                  <td className="py-2.5 text-neutral-500">
                    {r.completedAt ? new Date(r.completedAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
