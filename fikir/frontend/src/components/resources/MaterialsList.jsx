import { useState } from 'react';

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

export default function MaterialsList({ materials, subjects, onRefresh, disabled }) {
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState(null);

  async function updateSubject(id, subjectId) {
    setErr(null);
    setBusyId(id);
    try {
      await apiJson(`/api/resources/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ subjectId: subjectId === '' ? null : Number(subjectId) }),
      });
      await onRefresh();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this file from your library and Cloudinary?')) return;
    setErr(null);
    setBusyId(id);
    try {
      await apiJson(`/api/resources/${id}`, { method: 'DELETE' });
      await onRefresh();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  }

  if (!materials?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/60 px-6 py-12 text-center text-sm text-neutral-600">
        No uploads yet. Add a PDF, image, or Word document — max 10MB each.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{err}</div>
      )}
      <ul className="space-y-4">
        {materials.map((m) => (
          <li
            key={m.id}
            className="flex flex-col gap-4 rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm sm:flex-row sm:items-stretch"
          >
            <div className="flex shrink-0 justify-center sm:w-28">
              {m.thumbnailUrl ? (
                <img
                  src={m.thumbnailUrl}
                  alt=""
                  className="h-24 w-24 rounded-xl border border-neutral-100 object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-500">
                  {m.mimeType?.includes('pdf') ? 'PDF' : 'FILE'}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-deep-blue">{m.fileName}</p>
              <p className="mt-1 text-xs text-neutral-500">
                Uploaded {m.uploadedAt ? new Date(m.uploadedAt).toLocaleString() : '—'}
              </p>
              <label className="mt-3 block text-xs font-semibold uppercase text-neutral-500">Subject</label>
              <select
                value={m.subjectId ?? ''}
                disabled={disabled || busyId === m.id}
                onChange={(e) => updateSubject(m.id, e.target.value)}
                className="mt-1 w-full max-w-xs rounded-lg border border-neutral-200 px-2 py-2 text-sm font-medium text-deep-blue sm:w-56"
              >
                <option value="">Untagged</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex shrink-0 flex-row gap-2 sm:flex-col sm:justify-center">
              <a
                href={m.cloudinaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center rounded-full border border-deep-blue px-4 py-2 text-center text-xs font-semibold text-deep-blue hover:bg-deep-blue/5 sm:flex-none"
              >
                Download
              </a>
              <button
                type="button"
                disabled={busyId === m.id}
                onClick={() => remove(m.id)}
                className="inline-flex flex-1 items-center justify-center rounded-full bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-100 disabled:opacity-50 sm:flex-none"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
