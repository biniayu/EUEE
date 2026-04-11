import { Link } from 'react-router-dom';

const modes = [
  {
    id: 'subject',
    title: 'Practice by subject',
    desc: 'One subject, adaptive difficulty.',
  },
  {
    id: 'topic',
    title: 'Practice by topic',
    desc: 'Pick a topic (e.g. Algebra) within a subject.',
  },
  {
    id: 'mock',
    title: 'Full mock exam',
    desc: 'Mixed questions across the full curriculum.',
  },
];

export default function ModeSelection({
  activeMode,
  setActiveMode,
  subjects,
  subjectId,
  setSubjectId,
  topics,
  topic,
  setTopic,
  onStart,
  busy,
  error,
}) {
  return (
    <div className="space-y-8">
      <Link
        to="/dashboard"
        className="inline-block text-sm font-semibold text-brand-emerald hover:text-deep-blue"
      >
        ← Back to dashboard
      </Link>

      <div className="grid gap-4 md:grid-cols-3">
        {modes.map((m) => {
          const on = activeMode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              disabled={busy}
              onClick={() => setActiveMode(m.id)}
              className={`rounded-2xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 ${
                on
                  ? 'border-brand-emerald bg-brand-emerald/10 ring-2 ring-brand-emerald/30'
                  : 'border-neutral-200/80 bg-white hover:border-brand-emerald/40'
              }`}
            >
              <h2 className="text-lg font-bold text-deep-blue">{m.title}</h2>
              <p className="mt-2 text-sm text-neutral-600">{m.desc}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h3 className="font-bold text-deep-blue">Session setup</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-neutral-700">Subject</label>
            <select
              className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-brand-emerald disabled:bg-neutral-50"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              disabled={activeMode === 'mock' || !activeMode}
            >
              <option value="">Select subject…</option>
              {subjects.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </select>
            {activeMode === 'mock' && (
              <p className="mt-1 text-xs text-neutral-500">Not used for full mock — all subjects included.</p>
            )}
          </div>
          <div>
            <label className="text-sm font-semibold text-neutral-700">Topic</label>
            <select
              className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-brand-emerald disabled:bg-neutral-50"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={activeMode !== 'topic' || !subjectId || topics.length === 0}
            >
              <option value="">Select topic…</option>
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {activeMode === 'topic' && !subjectId && (
              <p className="mt-1 text-xs text-amber-700">Choose a subject first to load topics.</p>
            )}
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={busy || !activeMode}
          onClick={onStart}
          className="mt-6 w-full rounded-full bg-deep-blue py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#0a2b52] disabled:opacity-50 sm:w-auto sm:px-10"
        >
          {busy ? 'Starting…' : 'Start practice session'}
        </button>
      </div>
    </div>
  );
}
