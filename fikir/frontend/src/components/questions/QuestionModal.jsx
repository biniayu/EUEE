import { useCallback, useEffect, useState } from 'react';

async function apiJson(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export default function QuestionModal({ questionId, open, onClose, onNext, onFavoriteChange }) {
  const [q, setQ] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState('');
  const [shortText, setShortText] = useState('');
  const [submitted, setSubmitted] = useState(null);
  const [favBusy, setFavBusy] = useState(false);

  const loadQuestion = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setSelected('');
    setShortText('');
    setSubmitted(null);
    try {
      const data = await apiJson(`/api/questions/${id}`);
      setQ(data.question);
    } catch (e) {
      setError(e.message);
      setQ(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && questionId) loadQuestion(questionId);
  }, [open, questionId, loadQuestion]);

  async function toggleFavorite() {
    if (!q) return;
    setFavBusy(true);
    try {
      await apiJson(`/api/questions/${q.id}/favorite`, {
        method: 'POST',
        body: JSON.stringify({ favorite: !q.isFavorite }),
      });
      setQ((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : prev));
      onFavoriteChange?.();
    } catch {
      /* ignore */
    } finally {
      setFavBusy(false);
    }
  }

  async function submitAnswer() {
    if (!q) return;
    const payload =
      q.questionType === 'short_answer'
        ? { selectedAnswer: shortText.trim() }
        : { selectedAnswer: selected };

    if (q.questionType === 'short_answer' && !payload.selectedAnswer) return;
    if (q.questionType !== 'short_answer' && payload.selectedAnswer === '') return;

    setLoading(true);
    try {
      const data = await apiJson(`/api/questions/${q.id}/attempt`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setSubmitted(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function nextQuestion() {
    if (onNext) {
      onNext();
    } else {
      onClose();
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-end justify-center bg-deep-blue/60 p-0 sm:p-6 sm:pt-10">
      <div
        className="flex max-h-full w-full max-w-2xl flex-col rounded-t-3xl bg-white shadow-2xl sm:max-h-[min(90vh,44rem)] sm:rounded-3xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="qb-modal-title"
      >
        <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-emerald" id="qb-modal-title">
              {q?.subjectName || 'Question'}
            </p>
            <p className="text-sm text-neutral-500">{q?.topic}</p>
          </div>
          <div className="flex items-center gap-2">
            {q && (
              <button
                type="button"
                disabled={favBusy}
                onClick={toggleFavorite}
                className="rounded-full border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                aria-pressed={q.isFavorite}
              >
                {q.isFavorite ? '★ Favorited' : '☆ Favorite'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading && !q && <div className="h-40 animate-pulse rounded-xl bg-neutral-100" />}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {q && (
            <>
              <div className="rounded-xl bg-neutral-50 px-4 py-3 text-base leading-relaxed text-neutral-900">
                {q.questionText}
              </div>

              {!submitted && q.questionType === 'multiple_choice' && (
                <ul className="mt-4 space-y-2">
                  {q.choices?.map((c, idx) => (
                    <li key={idx}>
                      <button
                        type="button"
                        onClick={() => setSelected(String(idx))}
                        className={`flex w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                          selected === String(idx)
                            ? 'border-brand-emerald bg-brand-emerald/10 text-deep-blue ring-2 ring-brand-emerald/30'
                            : 'border-neutral-200 bg-white hover:border-brand-emerald/40'
                        }`}
                      >
                        <span className="mr-3 font-bold text-brand-emerald">{String.fromCharCode(65 + idx)}.</span>
                        <span>{c}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {!submitted && q.questionType === 'short_answer' && (
                <div className="mt-4">
                  <label className="text-xs font-semibold text-neutral-600">Your answer</label>
                  <textarea
                    value={shortText}
                    onChange={(e) => setShortText(e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                    placeholder="Type your answer…"
                  />
                </div>
              )}

              {!submitted && (
                <button
                  type="button"
                  disabled={
                    loading ||
                    (q.questionType === 'short_answer' ? !shortText.trim() : selected === '')
                  }
                  onClick={submitAnswer}
                  className="mt-6 w-full rounded-full bg-deep-blue py-3 text-sm font-semibold text-white shadow-md hover:bg-[#002a52] disabled:opacity-50"
                >
                  Submit answer
                </button>
              )}

              {submitted && (
                <div
                  className={`mt-4 rounded-2xl border px-4 py-4 ${
                    submitted.correct
                      ? 'border-brand-emerald/40 bg-brand-emerald/10'
                      : 'border-amber-300/60 bg-amber-50'
                  }`}
                >
                  <p className="text-sm font-bold text-deep-blue">
                    {submitted.correct ? 'Correct — well done!' : 'Not quite — here is the learning moment.'}
                  </p>
                  {!submitted.correct && (
                    <p className="mt-2 text-sm text-neutral-800">
                      <span className="font-semibold">Correct option: </span>
                      {submitted.correctChoiceText != null
                        ? `${String.fromCharCode(65 + Number(submitted.correctAnswer))}. ${submitted.correctChoiceText}`
                        : submitted.correctAnswer}
                    </p>
                  )}
                  <div className="mt-3 text-sm leading-relaxed text-neutral-800">
                    <p className="font-semibold text-deep-blue">Explanation</p>
                    <p className="mt-1 whitespace-pre-wrap">{submitted.explanation}</p>
                  </div>
                  <button
                    type="button"
                    onClick={nextQuestion}
                    className="mt-4 w-full rounded-full border border-deep-blue bg-white py-2.5 text-sm font-semibold text-deep-blue hover:bg-deep-blue/5"
                  >
                    {onNext ? 'Next question' : 'Close'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
