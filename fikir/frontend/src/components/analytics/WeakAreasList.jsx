export default function WeakAreasList({ items }) {
  const list = items || [];
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold text-deep-blue">Weak areas</h3>
      <p className="mt-1 text-sm text-neutral-600">
        Lower strength scores mean more room to grow — prioritize these topics in practice.
      </p>
      {list.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">No weak-area records yet. Complete diagnostics or practice tests.</p>
      ) : (
        <ul className="mt-4 divide-y divide-neutral-100">
          {list.map((w, i) => (
            <li key={`${w.topic}-${i}`} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="font-semibold text-neutral-900">{w.topic}</p>
                <p className="text-xs text-neutral-500">{w.subjectName}</p>
              </div>
              <div className="text-right">
                <p
                  className={`text-lg font-bold ${
                    w.strengthScore < 45 ? 'text-red-600' : w.strengthScore < 65 ? 'text-amber-600' : 'text-emerald-600'
                  }`}
                >
                  {w.strengthScore}
                </p>
                <p className="text-xs text-neutral-500">strength</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
