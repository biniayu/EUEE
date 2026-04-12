import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useChatbotPageContext } from '../components/chatbot/ChatbotContext.jsx';
import LearningLayout from '../components/learning/LearningLayout.jsx';
import UploadZone from '../components/resources/UploadZone.jsx';
import MaterialsList from '../components/resources/MaterialsList.jsx';
import ReferenceSection from '../components/resources/ReferenceSection.jsx';
import ApiErrorAlert from '../components/ui/ApiErrorAlert.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import { useToast } from '../components/ui/ToastProvider.jsx';
import { linkBack } from '../components/ui/designTokens.js';

async function fetchJson(path) {
  const res = await fetch(path, { credentials: 'include' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export default function Resources() {
  const toast = useToast();
  const { setPageContext } = useChatbotPageContext();
  const [subjects, setSubjects] = useState([]);
  const [uploadSubjectId, setUploadSubjectId] = useState('');
  const [uploads, setUploads] = useState([]);
  const [reference, setReference] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setPageContext({ type: 'resources' });
    return () => setPageContext({});
  }, [setPageContext]);

  const loadSubjects = useCallback(async () => {
    try {
      const data = await fetchJson('/api/subjects');
      setSubjects(data.subjects || []);
    } catch {
      setSubjects([]);
    }
  }, []);

  const loadResources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJson('/api/resources');
      setUploads(data.uploads || []);
      setReference(data.reference || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  return (
    <LearningLayout title="Materials & resources">
      <div className="mx-auto max-w-5xl space-y-10">
        <div>
          <Link to="/dashboard" className={linkBack}>
            ← Dashboard
          </Link>
          <p className="mt-2 max-w-2xl text-sm text-neutral-600">
            Secure Cloudinary storage for your notes and past papers, plus curated reference links for EUEE prep.
          </p>
        </div>

        <section className="space-y-6">
          <h2 className="text-xl font-bold text-deep-blue">My uploaded materials</h2>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase text-neutral-500">Tag uploads (optional)</label>
              <select
                value={uploadSubjectId}
                onChange={(e) => setUploadSubjectId(e.target.value)}
                className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm font-medium text-deep-blue"
              >
                <option value="">General / mixed</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <UploadZone
              key={uploadSubjectId || 'none'}
              subjectId={uploadSubjectId}
              onUploaded={() => {
                loadResources();
                toast.show('File uploaded successfully.', 'success');
              }}
              disabled={loading}
            />
          </div>

          {loading && <Skeleton height="h-32" className="w-full" />}
          <ApiErrorAlert title="Could not load materials" message={error} onRetry={loadResources} />
          {!loading && (
            <MaterialsList
              materials={uploads}
              subjects={subjects}
              onRefresh={loadResources}
              disabled={loading}
            />
          )}
        </section>

        <ReferenceSection items={reference} />
      </div>
    </LearningLayout>
  );
}
