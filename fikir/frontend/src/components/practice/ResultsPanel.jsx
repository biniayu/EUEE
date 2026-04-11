import { Link } from 'react-router-dom';

export default function ResultsPanel({ results, onPracticeAgain }) {
  const { score, timeTakenSeconds, bySubject, byTopic, questions } = results;

  function formatTime(sec) {
    if (sec == null) return '—';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-neutral-200 bg-gradient-to-br from-deep-blue to-[#0a2b52] p-8 text-white shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-emerald/90">Session complete</p>
        <p className="mt-2 text-4xl font-black sm:text-5xl">{score.percent}%</p>
        <p className="mt-2 text-lg text-white/90">
          {score.correct} correct out of {score.total} · Time {formatTime(timeTakenSeconds)}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onPracticeAgain}
            className="rounded-full bg-brand-emerald px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-emerald-500"
          >
            Practice again
          </button>
          <Link
            to="/subjects"
            className="inline-flex items-center rounded-full border border-white/40 px-6 py-3 text-sm font-bold text-white hover:bg-white/10"
          >
            Review weak areas →
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center rounded-full border border-white/40 px-6 py-3 text-sm font-bold text-white hover:bg-white/10"
          >
            Dashboard
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-deep-blue">By subject</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {(bySubject || []).map((row) => (
              <li key={row.subjectName} className="flex justify-between rounded-lg bg-neutral-50 px-3 py-2">
                <span>{row.subjectName}</span>
                <span className="font-semibold">
                  {row.correct}/{row.total} ({row.percent}%)
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-deep-blue">By topic</h3>
          <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
            {(byTopic || []).map((row) => (
              <li key={row.topic + row.subjectName} className="flex justify-between rounded-lg bg-neutral-50 px-3 py-2">
                <span className="truncate pr-2">
                  {row.subjectName} — {row.topic}
                </span>
                <span className="shrink-0 font-semibold">
                  {row.correct}/{row.total}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h3 className="font-bold text-deep-blue">Question review</h3>
        <p className="mt-1 text-sm text-neutral-600">Explanations for every item — focus on missed questions.</p>
        <ul className="mt-4 space-y-4">
          {(questions || []).map((q, i) => (
            <li
              key={q.id}
              className={`rounded-xl border p-4 ${
                q.isCorrect ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/40'
              }`}
            >
              <p className="text-xs font-bold text-neutral-500">
                Q{i + 1} · {q.subjectName} · {q.topic}
                {q.skipped && ' · Skipped'}
              </p>
              <p className="mt-1 font-medium text-neutral-900">{q.questionText}</p>
              <p className="mt-2 text-sm text-neutral-700">
                Your answer:{' '}
                <span className="font-semibold">
                  {q.skipped
                    ? '(skipped)'
                    : (q.choices || [])[Number(q.selectedAnswer)] ?? q.selectedAnswer}
                </span>
                {' · '}
                Correct:{' '}
                <span className="font-semibold text-brand-emerald">
                  {(q.choices || [])[Number(q.correctAnswer)] ?? `Option ${Number(q.correctAnswer) + 1}`}
                </span>
              </p>
              {q.explanation && (
                <p className="mt-2 rounded-lg bg-white/80 p-3 text-sm text-neutral-700 ring-1 ring-neutral-100">
                  {q.explanation}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
