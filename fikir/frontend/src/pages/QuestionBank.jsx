import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useChatbotPageContext } from '../components/chatbot/ChatbotContext.jsx';
import LearningLayout from '../components/learning/LearningLayout.jsx';
import QuestionFilters from '../components/questions/QuestionFilters.jsx';
import QuestionCard from '../components/questions/QuestionCard.jsx';
import QuestionModal from '../components/questions/QuestionModal.jsx';
import CustomSetModal from '../components/questions/CustomSetModal.jsx';

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

function buildQuery(params) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v != null) sp.set(k, String(v));
  });
  return sp.toString();
}

export default function QuestionBank() {
  const { setPageContext } = useChatbotPageContext();
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [questionType, setQuestionType] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [tab, setTab] = useState('browse');

  const [customOpen, setCustomOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalQuestionId, setModalQuestionId] = useState(null);
  const [modalIdx, setModalIdx] = useState(0);
  const [queueLen, setQueueLen] = useState(0);
  const queueRef = useRef([]);

  useEffect(() => {
    setPageContext({ type: 'question_bank' });
    return () => setPageContext({});
  }, [setPageContext]);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiJson('/api/subjects');
        setSubjects(data.subjects || []);
      } catch {
        setSubjects([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!subjectId) {
      setTopics([]);
      setTopic('');
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingTopics(true);
      try {
        const data = await apiJson(`/api/questions/meta/topics?subjectId=${encodeURIComponent(subjectId)}`);
        if (!cancelled) setTopics(data.topics || []);
      } catch {
        if (!cancelled) setTopics([]);
      } finally {
        if (!cancelled) setLoadingTopics(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [subjectId]);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const path =
        tab === 'favorites'
          ? '/api/questions/favorites'
          : `/api/questions?${buildQuery({
              search,
              subjectId,
              topic,
              difficulty,
              questionType,
              limit: 48,
            })}`;
      const data = await apiJson(path);
      setQuestions(data.questions || []);
    } catch (e) {
      setError(e.message);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [tab, search, subjectId, topic, difficulty, questionType]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const refetchList = useCallback(() => {
    loadQuestions();
  }, [loadQuestions]);

  const openQuestion = (id, queue = null) => {
    const ids = queue && queue.length ? queue : [id];
    queueRef.current = ids;
    setQueueLen(ids.length);
    setModalIdx(0);
    setModalQuestionId(ids[0]);
    setModalOpen(true);
  };

  const handleModalNext = () => {
    const q = queueRef.current;
    const ni = modalIdx + 1;
    if (ni < q.length) {
      setModalIdx(ni);
      setModalQuestionId(q[ni]);
    } else {
      setModalOpen(false);
      setModalQuestionId(null);
      setModalIdx(0);
      setQueueLen(0);
      queueRef.current = [];
      refetchList();
    }
  };

  const startCustomSet = async (count) => {
    const qs = buildQuery({
      search,
      subjectId,
      topic,
      difficulty,
      questionType,
      limit: count,
      random: '1',
    });
    const data = await apiJson(`/api/questions?${qs}`);
    const ids = (data.questions || []).map((x) => x.id);
    if (!ids.length) throw new Error('No questions match these filters. Try widening filters or pick a subject.');
    openQuestion(ids[0], ids);
  };

  return (
    <LearningLayout title="Question bank">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link to="/dashboard" className="text-sm font-semibold text-brand-emerald hover:text-deep-blue">
              ← Dashboard
            </Link>
            <p className="mt-2 max-w-2xl text-sm text-neutral-600">
              Search and filter real EUEE-style items from your database. Submit answers for instant feedback and
              analytics — every attempt is saved.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCustomOpen(true)}
              className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-deep-blue shadow-sm hover:bg-amber-400"
            >
              Create custom set
            </button>
            <Link
              to="/past-papers"
              className="inline-flex items-center rounded-full border border-deep-blue px-4 py-2 text-sm font-semibold text-deep-blue hover:bg-deep-blue/5"
            >
              Past papers
            </Link>
          </div>
        </div>

        <div className="flex gap-2 rounded-2xl border border-neutral-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setTab('browse')}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold ${
              tab === 'browse' ? 'bg-deep-blue text-white' : 'text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            Browse
          </button>
          <button
            type="button"
            onClick={() => setTab('favorites')}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold ${
              tab === 'favorites' ? 'bg-deep-blue text-white' : 'text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            Favorites
          </button>
        </div>

        {tab === 'browse' && (
          <QuestionFilters
            subjects={subjects}
            topics={topics}
            subjectId={subjectId}
            topic={topic}
            difficulty={difficulty}
            questionType={questionType}
            search={search}
            viewMode={viewMode}
            onSubjectChange={(v) => {
              setSubjectId(v);
              setTopic('');
            }}
            onTopicChange={setTopic}
            onDifficultyChange={setDifficulty}
            onQuestionTypeChange={setQuestionType}
            onSearchChange={setSearch}
            onViewModeChange={setViewMode}
            loadingTopics={loadingTopics}
          />
        )}

        {tab === 'favorites' && (
          <p className="rounded-2xl border border-brand-emerald/20 bg-brand-emerald/5 px-4 py-3 text-sm text-neutral-700">
            Questions you have starred appear here. Open any item to practice again.
          </p>
        )}

        {loading && <div className="h-48 animate-pulse rounded-2xl bg-neutral-100" />}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        )}

        {!loading && !error && (
          <div
            className={
              viewMode === 'grid' && tab === 'browse'
                ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
                : 'space-y-3'
            }
          >
            {questions.length === 0 && (
              <p className="rounded-2xl border border-dashed border-neutral-300 bg-white/60 px-6 py-10 text-center text-sm text-neutral-600">
                No questions found. Try different filters — if a subject has very few items, the server may
                generate more when Groq is configured.
              </p>
            )}
            {questions.map((q) => (
              <QuestionCard key={q.id} q={q} viewMode={tab === 'favorites' ? 'list' : viewMode} onView={openQuestion} />
            ))}
          </div>
        )}
      </div>

      <CustomSetModal
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        onStart={startCustomSet}
      />

      <QuestionModal
        open={modalOpen}
        questionId={modalQuestionId}
        onClose={() => {
          setModalOpen(false);
          setModalQuestionId(null);
          setModalIdx(0);
          setQueueLen(0);
          queueRef.current = [];
          refetchList();
        }}
        onNext={queueLen > 1 ? handleModalNext : undefined}
        onFavoriteChange={refetchList}
      />
    </LearningLayout>
  );
}
