import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function SubjectsTest() {
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/core/subjects', { credentials: 'include' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to load subjects');
        if (!cancelled) setSubjects(data.subjects || []);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-emerald">Phase 4 test</p>
        <h1 className="mt-2 text-2xl font-bold text-deep-blue">GET /api/core/subjects</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Protected route — you must be logged in. Subjects are loaded from PostgreSQL.
        </p>

        {loading && <p className="mt-6 text-neutral-500">Loading…</p>}
        {error && (
          <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && (
          <ul className="mt-6 space-y-3">
            {subjects.map((s) => (
              <li
                key={s.id}
                className="flex items-start justify-between gap-4 rounded-2xl border border-neutral-100 bg-neutral-50/80 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-neutral-900">{s.name}</p>
                  {s.description && <p className="text-sm text-neutral-600">{s.description}</p>}
                </div>
                <span className="shrink-0 rounded-full bg-brand-amber/15 px-2 py-1 text-xs font-semibold text-deep-blue">
                  {s.euee_weightage != null ? `${s.euee_weightage}%` : '—'}
                </span>
              </li>
            ))}
          </ul>
        )}

        <Link
          to="/"
          className="mt-8 inline-block text-sm font-semibold text-brand-emerald hover:text-deep-blue"
        >
          ← Back home
        </Link>
      </div>
    </div>
  );
}
