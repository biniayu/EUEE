function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TestRunner({
  question,
  progress,
  elapsedSeconds,
  selected,
  setSelected,
  markReview,
  setMarkReview,
  onSkip,
  onNext,
  loading,
  adaptiveNote,
  onExit,
}) {
  const pct = progress.total ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-neutral-100">
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-3 py-2 sm:px-4">
        <button
          type="button"
          onClick={onExit}
          className="text-sm font-semibold text-neutral-500 hover:text-red-600"
        >
          Exit
        </button>
        <div className="flex items-center gap-3 text-sm">
          <span className="rounded-full bg-deep-blue/10 px-3 py-1 font-mono font-bold text-deep-blue">
            {formatTime(elapsedSeconds)}
          </span>
          <span className="hidden text-neutral-600 sm:inline">
            Q {progress.current} / {progress.total}
          </span>
        </div>
      </div>

      <div className="h-1.5 w-full bg-neutral-200">
        <div
          className="h-full bg-gradient-to-r from-deep-blue via-brand-emerald to-brand-amber transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6 sm:px-8">
        <p className="text-center text-xs font-semibold uppercase text-neutral-500 sm:hidden">
          Question {progress.current} of {progress.total}
        </p>

        {adaptiveNote && (
          <div className="mx-auto mb-4 max-w-2xl rounded-xl border border-brand-amber/40 bg-brand-amber/10 px-4 py-2 text-center text-sm text-amber-950">
            {adaptiveNote}
          </div>
        )}

        {question && (
          <div className="mx-auto w-full max-w-2xl flex-1 rounded-2xl border border-neutral-200 bg-white p-6 shadow-md">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-brand-emerald/15 px-2 py-0.5 font-bold text-emerald-900">
                {question.subjectName}
              </span>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700">
                {question.topic}
              </span>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-500">{question.difficulty}</span>
            </div>
            <p className="mt-4 text-lg font-semibold leading-snug text-neutral-900">{question.questionText}</p>

            <div className="mt-6 space-y-2">
              {(question.choices || []).map((choice, idx) => (
                <label
                  key={idx}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                    selected === String(idx)
                      ? 'border-brand-emerald bg-brand-emerald/10 ring-2 ring-brand-emerald/30'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="mc"
                    checked={selected === String(idx)}
                    onChange={() => setSelected(String(idx))}
                    className="h-4 w-4 text-brand-emerald"
                  />
                  <span className="font-medium text-neutral-800">{choice}</span>
                </label>
              ))}
            </div>

            <label className="mt-6 flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={markReview}
                onChange={(e) => setMarkReview(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-brand-amber"
              />
              Mark for review
            </label>
          </div>
        )}
      </div>

      <div className="border-t border-neutral-200 bg-white p-4">
        <div className="mx-auto flex max-w-2xl flex-wrap gap-2 sm:justify-between">
          <button
            type="button"
            disabled={loading}
            onClick={onSkip}
            className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            Skip
          </button>
          <button
            type="button"
            disabled={loading || selected == null}
            onClick={onNext}
            className="rounded-full bg-deep-blue px-8 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#0a2b52] disabled:opacity-50"
          >
            {loading ? 'Saving…' : progress.current >= progress.total ? 'Submit answer' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
