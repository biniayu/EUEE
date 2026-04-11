import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import LearningLayout from '../components/learning/LearningLayout.jsx';
import VideoEmbed from '../components/learning/VideoEmbed.jsx';
import LessonText from '../components/learning/LessonText.jsx';

async function fetchJson(path, options) {
  const res = await fetch(path, { credentials: 'include', ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function PracticeBlock({ question }) {
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const correct = selected != null && Number(selected) === Number(question.correctIndex);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase text-brand-amber">{question.topic}</p>
      <p className="mt-2 font-medium text-neutral-900">{question.questionText}</p>
      <div className="mt-3 space-y-2">
        {(question.choices || []).map((c, idx) => (
          <label
            key={idx}
            className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
              selected === idx
                ? 'border-brand-emerald bg-brand-emerald/10'
                : 'border-neutral-200 hover:border-neutral-300'
            }`}
          >
            <input
              type="radio"
              name={`q-${question.id}`}
              checked={selected === idx}
              onChange={() => {
                setSelected(idx);
                setRevealed(false);
              }}
            />
            <span>{c}</span>
          </label>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={selected == null}
          onClick={() => setRevealed(true)}
          className="rounded-full border border-deep-blue px-4 py-2 text-sm font-semibold text-deep-blue transition hover:bg-deep-blue/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Check answer
        </button>
      </div>
      {revealed && selected != null && (
        <p
          className={`mt-3 rounded-xl px-3 py-2 text-sm font-medium ${
            correct ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'
          }`}
        >
          {correct ? 'Correct — nice work!' : 'Not quite — review the explanation below.'}
          {question.explanation && (
            <span className="mt-1 block font-normal text-neutral-700">{question.explanation}</span>
          )}
        </p>
      )}
    </div>
  );
}

export default function LessonDetail() {
  const { lessonId } = useParams();
  const startedAt = useRef(Date.now());
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [completeMessage, setCompleteMessage] = useState(null);
  const [completeError, setCompleteError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCompleteMessage(null);
    setCompleteError(null);
    startedAt.current = Date.now();
    try {
      const data = await fetchJson(`/api/lessons/${lessonId}`);
      setPayload(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    load();
  }, [load]);

  const lesson = payload?.lesson;
  const nav = payload?.navigation;
  const questions = payload?.practiceQuestions || [];

  const title = useMemo(() => lesson?.title || 'Lesson', [lesson]);

  async function markComplete() {
    setCompleteLoading(true);
    setCompleteError(null);
    setCompleteMessage(null);
    const elapsedSec = Math.min(86400, Math.round((Date.now() - startedAt.current) / 1000));
    try {
      const data = await fetchJson(`/api/lessons/${lessonId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeSpentSeconds: elapsedSec }),
      });
      setCompleteMessage(data.message || 'Saved.');
      setPayload((prev) =>
        prev
          ? {
              ...prev,
              lesson: {
                ...prev.lesson,
                completed: true,
                timeSpentSeconds: data.progress?.timeSpentSeconds ?? prev.lesson.timeSpentSeconds,
                completedAt: data.progress?.completedAt ?? prev.lesson.completedAt,
              },
            }
          : prev
      );
    } catch (e) {
      setCompleteError(e.message);
    } finally {
      setCompleteLoading(false);
    }
  }

  return (
    <LearningLayout title={title}>
      <div className="mx-auto max-w-3xl space-y-6">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
          <Link to="/subjects" className="font-medium text-brand-emerald hover:text-deep-blue">
            Subjects
          </Link>
          <span className="text-neutral-300">/</span>
          <Link
            to={`/subjects/${lesson?.subjectId || ''}`}
            className="font-medium text-brand-emerald hover:text-deep-blue"
          >
            {lesson?.subjectName || 'Subject'}
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-800">Lesson</span>
        </nav>

        {loading && (
          <div className="space-y-4">
            <div className="h-12 animate-pulse rounded-2xl bg-neutral-200" />
            <div className="aspect-video animate-pulse rounded-2xl bg-neutral-100" />
            <div className="h-40 animate-pulse rounded-2xl bg-neutral-100" />
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50/90 px-5 py-4 text-red-800">
            <p className="font-semibold">Lesson unavailable</p>
            <p className="mt-1 text-sm">{error}</p>
            <button
              type="button"
              onClick={load}
              className="mt-4 rounded-full bg-deep-blue px-4 py-2 text-sm font-semibold text-white"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && lesson && (
          <>
            <header className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-deep-blue/10 px-3 py-1 text-xs font-bold uppercase text-deep-blue">
                  {lesson.contentType === 'video' ? 'Video lesson' : 'Reading lesson'}
                </span>
                {lesson.completed && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    Completed
                  </span>
                )}
              </div>
              <h1 className="mt-3 text-2xl font-extrabold text-deep-blue sm:text-3xl">{lesson.title}</h1>
              <p className="mt-2 text-sm text-neutral-500">
                About {lesson.durationMinutes} minutes · {lesson.difficulty || 'medium'} difficulty
              </p>
            </header>

            {lesson.contentType === 'video' ? (
              <VideoEmbed url={lesson.contentUrl} title={lesson.title} />
            ) : (
              <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm sm:p-8">
                <LessonText text={lesson.textContent} />
              </div>
            )}

            {completeMessage && (
              <div
                className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
                role="status"
              >
                {completeMessage}
              </div>
            )}
            {completeError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {completeError}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={markComplete}
                disabled={completeLoading || lesson.completed}
                className="rounded-full bg-brand-emerald px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {lesson.completed ? 'Already complete' : completeLoading ? 'Saving…' : 'Mark as complete'}
              </button>
              {nav?.previousLessonId && (
                <Link
                  to={`/lessons/${nav.previousLessonId}`}
                  className="inline-flex items-center rounded-full border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
                >
                  ← Previous
                </Link>
              )}
              {nav?.nextLessonId && (
                <Link
                  to={`/lessons/${nav.nextLessonId}`}
                  className="inline-flex items-center rounded-full border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
                >
                  Next →
                </Link>
              )}
            </div>

            {questions.length > 0 && (
              <section className="rounded-3xl border border-brand-amber/25 bg-gradient-to-br from-brand-amber/10 via-white to-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-deep-blue">Practice check</h2>
                <p className="mt-1 text-sm text-neutral-600">
                  {questions.length} question{questions.length === 1 ? '' : 's'} from the question bank for this subject.
                </p>
                <div className="mt-5 space-y-4">
                  {questions.map((q) => (
                    <PracticeBlock key={q.id} question={q} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </LearningLayout>
  );
}
