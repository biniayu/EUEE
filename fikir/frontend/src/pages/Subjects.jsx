import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LearningLayout from '../components/learning/LearningLayout.jsx';

async function fetchJson(path) {
  const res = await fetch(path, { credentials: 'include' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJson('/api/subjects');
      setSubjects(data.subjects || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <LearningLayout title="Subjects">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-emerald">Learning modules</p>
          <h2 className="mt-2 text-2xl font-extrabold text-deep-blue sm:text-3xl">
            Your EUEE subject lineup
          </h2>
          <p className="mt-2 max-w-2xl text-neutral-600">
            Pick a subject to follow structured lessons — video explainers, concise notes, and built-in practice.
          </p>
        </div>

        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-52 animate-pulse rounded-2xl bg-neutral-100" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50/90 px-5 py-4 text-red-800">
            <p className="font-semibold">Could not load subjects</p>
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

        {!loading && !error && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {subjects.map((s) => (
              <article
                key={s.id}
                className="group flex flex-col rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-brand-emerald/35 hover:shadow-md"
              >
                <h3 className="text-xl font-bold text-deep-blue">{s.name}</h3>
                {s.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{s.description}</p>
                )}
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs font-medium text-neutral-500">
                    <span>Progress</span>
                    <span>{s.progressPercent}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-deep-blue via-brand-emerald to-brand-amber transition-all duration-500"
                      style={{ width: `${s.progressPercent}%` }}
                    />
                  </div>
                </div>
                <dl className="mt-4 flex gap-6 text-sm text-neutral-600">
                  <div>
                    <dt className="text-xs uppercase text-neutral-400">Lessons done</dt>
                    <dd className="font-semibold text-neutral-900">
                      {s.lessonsCompleted}/{s.lessonsTotal}
                    </dd>
                  </div>
                  {s.eueeWeightage != null && (
                    <div>
                      <dt className="text-xs uppercase text-neutral-400">EUEE weight</dt>
                      <dd className="font-semibold text-neutral-900">{s.eueeWeightage}%</dd>
                    </div>
                  )}
                </dl>
                <Link
                  to={`/subjects/${s.id}`}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-deep-blue py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0a2b52] active:scale-[0.99]"
                >
                  Start learning
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </LearningLayout>
  );
}
