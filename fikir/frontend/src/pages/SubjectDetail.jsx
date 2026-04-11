import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import LearningLayout from '../components/learning/LearningLayout.jsx';
import { useChatbotPageContext } from '../components/chatbot/ChatbotContext.jsx';

async function fetchJson(path) {
  const res = await fetch(path, { credentials: 'include' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function TypeBadge({ type }) {
  const isVideo = type === 'video';
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${
        isVideo ? 'bg-brand-amber/20 text-amber-900' : 'bg-brand-emerald/15 text-emerald-900'
      }`}
    >
      {isVideo ? 'Video' : 'Text'}
    </span>
  );
}

export default function SubjectDetail() {
  const { subjectId } = useParams();
  const { setPageContext } = useChatbotPageContext();
  const [meta, setMeta] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJson(`/api/subjects/${subjectId}`);
      setMeta(data.subject);
      setLessons(data.lessons || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!meta) return undefined;
    setPageContext({
      type: 'subject',
      subjectId: meta.id,
      subjectName: meta.name,
    });
    return () => setPageContext({});
  }, [meta, setPageContext]);

  const continueId = meta?.nextLessonId || lessons.find((l) => !l.completed)?.id;

  return (
    <LearningLayout title={meta?.name || 'Subject'}>
      <div className="mx-auto max-w-3xl space-y-6">
        <nav className="text-sm text-neutral-500">
          <Link to="/subjects" className="font-medium text-brand-emerald hover:text-deep-blue">
            Subjects
          </Link>
          <span className="mx-2 text-neutral-300">/</span>
          <span className="text-neutral-800">{meta?.name || '…'}</span>
        </nav>

        {loading && (
          <div className="space-y-4">
            <div className="h-10 w-2/3 animate-pulse rounded-xl bg-neutral-200" />
            <div className="h-24 animate-pulse rounded-2xl bg-neutral-100" />
            <div className="h-40 animate-pulse rounded-2xl bg-neutral-100" />
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50/90 px-5 py-4 text-red-800">
            <p className="font-semibold">Unable to load this subject</p>
            <p className="mt-1 text-sm">{error}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={load}
                className="rounded-full bg-deep-blue px-4 py-2 text-sm font-semibold text-white"
              >
                Retry
              </button>
              <Link
                to="/subjects"
                className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700"
              >
                All subjects
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && meta && (
          <>
            <header className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-semibold text-brand-emerald">Subject overview</p>
              <h1 className="mt-2 text-3xl font-extrabold text-deep-blue">{meta.name}</h1>
              {meta.description && <p className="mt-3 text-neutral-600">{meta.description}</p>}
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-neutral-400">Overall progress</p>
                  <p className="text-2xl font-bold text-deep-blue">{meta.progressPercent}%</p>
                </div>
                <div className="h-10 w-px bg-neutral-200" aria-hidden />
                <div>
                  <p className="text-xs font-semibold uppercase text-neutral-400">Lessons completed</p>
                  <p className="text-lg font-semibold text-neutral-800">
                    {meta.lessonsCompleted} / {meta.lessonsTotal}
                  </p>
                </div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-deep-blue via-brand-emerald to-brand-amber transition-all duration-500"
                  style={{ width: `${meta.progressPercent}%` }}
                />
              </div>
              {continueId && (
                <Link
                  to={`/lessons/${continueId}`}
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-brand-emerald px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-emerald-600"
                >
                  Continue learning →
                </Link>
              )}
              {!continueId && lessons.length > 0 && (
                <p className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
                  You&apos;ve completed every lesson in this subject. Review any lesson below to reinforce.
                </p>
              )}
            </header>

            <section className="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-deep-blue">Lessons</h2>
              <p className="mt-1 text-sm text-neutral-500">Open a lesson to study — videos and notes, then quick practice.</p>

              <ol className="mt-6 space-y-3">
                {lessons.map((lesson, idx) => (
                  <li key={lesson.id}>
                    <details className="group rounded-2xl border border-neutral-100 bg-neutral-50/80 open:bg-white open:shadow-md">
                      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl px-4 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-deep-blue text-xs font-bold text-white">
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-neutral-900">{lesson.title}</span>
                            <TypeBadge type={lesson.contentType} />
                            {lesson.completed && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                                Done
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-neutral-500">
                            {lesson.durationMinutes} min · {lesson.contentType === 'video' ? 'Watch & reflect' : 'Read & practice'}
                          </p>
                        </div>
                        <svg
                          className="h-5 w-5 shrink-0 text-neutral-400 transition group-open:rotate-180"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="border-t border-neutral-100 px-4 pb-4 pt-2">
                        <Link
                          to={`/lessons/${lesson.id}`}
                          className="inline-flex rounded-full bg-deep-blue px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#0a2b52]"
                        >
                          Open lesson
                        </Link>
                      </div>
                    </details>
                  </li>
                ))}
              </ol>

              {lessons.length === 0 && (
                <p className="mt-6 text-center text-sm text-neutral-500">
                  No lessons are published for this subject yet.
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </LearningLayout>
  );
}
