import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotPageContext } from '../components/chatbot/ChatbotContext.jsx';
import LearningLayout from '../components/learning/LearningLayout.jsx';
import ModeSelection from '../components/practice/ModeSelection.jsx';
import TestRunner from '../components/practice/TestRunner.jsx';
import ResultsPanel from '../components/practice/ResultsPanel.jsx';

async function fetchJson(path, options) {
  const res = await fetch(path, { credentials: 'include', ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export default function PracticeTest() {
  const navigate = useNavigate();
  const { setPageContext } = useChatbotPageContext();

  const [screen, setScreen] = useState('select');
  const [activeMode, setActiveMode] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [topics, setTopics] = useState([]);
  const [topic, setTopic] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [question, setQuestion] = useState(null);
  const [progress, setProgress] = useState({ current: 1, total: 15 });
  const [selected, setSelected] = useState(null);
  const [markReview, setMarkReview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bootError, setBootError] = useState('');
  const [adaptiveNote, setAdaptiveNote] = useState('');
  const [results, setResults] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(null);
  const tickRef = useRef(null);

  useEffect(() => {
    setPageContext({ type: 'practice' });
    return () => setPageContext({});
  }, [setPageContext]);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchJson('/api/subjects');
        setSubjects(data.subjects || []);
      } catch {
        setBootError('Could not load subjects.');
      }
    })();
  }, []);

  useEffect(() => {
    if (!subjectId || activeMode !== 'topic') {
      setTopics([]);
      setTopic('');
      return;
    }
    (async () => {
      try {
        const data = await fetchJson(`/api/practice/topics/${subjectId}`);
        setTopics(data.topics || []);
      } catch {
        setTopics([]);
      }
    })();
  }, [subjectId, activeMode]);

  useEffect(() => {
    if (screen !== 'run' || !sessionId) return undefined;
    startedAt.current = Date.now();
    setElapsed(0);
    tickRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [screen, sessionId]);

  const resetSelection = useCallback(() => {
    setActiveMode(null);
    setSubjectId('');
    setTopic('');
    setTopics([]);
    setBootError('');
  }, []);

  const startSession = useCallback(async () => {
    setBootError('');
    if (!activeMode) {
      setBootError('Choose a practice mode.');
      return;
    }
    if (activeMode !== 'mock' && !subjectId) {
      setBootError('Select a subject for this mode.');
      return;
    }
    if (activeMode === 'topic' && !topic) {
      setBootError('Select a topic.');
      return;
    }

    setLoading(true);
    try {
      const body =
        activeMode === 'mock'
          ? { type: 'mock' }
          : activeMode === 'topic'
            ? { type: 'topic', subjectId: Number(subjectId), topic }
            : { type: 'subject', subjectId: Number(subjectId) };

      const data = await fetchJson('/api/practice/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      setSessionId(data.sessionId);
      setQuestion(data.question);
      setProgress({ current: data.currentIndex || 1, total: data.totalQuestions || 15 });
      setSelected(null);
      setMarkReview(false);
      setAdaptiveNote('');
      setScreen('run');
    } catch (e) {
      setBootError(e.message);
    } finally {
      setLoading(false);
    }
  }, [activeMode, subjectId, topic]);

  const finalizeSession = useCallback(async () => {
    if (!sessionId) return;
    const timeTakenSeconds = startedAt.current
      ? Math.min(86400, Math.floor((Date.now() - startedAt.current) / 1000))
      : elapsed;
    const data = await fetchJson('/api/practice/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, timeTakenSeconds }),
    });
    setResults(data.results);
    setScreen('results');
    if (tickRef.current) clearInterval(tickRef.current);
  }, [sessionId, elapsed]);

  const submit = useCallback(
    async (skipped) => {
      if (!sessionId || !question) return;
      if (!skipped && selected == null) return;

      setLoading(true);
      setAdaptiveNote('');
      try {
        const data = await fetchJson('/api/practice/submit-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            questionId: question.id,
            selectedAnswer: skipped ? null : selected,
            skipped,
            markForReview: markReview,
          }),
        });

        if (data.adaptiveNote) setAdaptiveNote(data.adaptiveNote);

        if (data.complete || data.insufficientQuestions) {
          try {
            await finalizeSession();
          } catch (err) {
            setBootError(err.message || 'Could not finalize session.');
            setScreen('select');
          }
          return;
        }

        setQuestion(data.nextQuestion);
        setProgress(data.progress || progress);
        setSelected(null);
        setMarkReview(false);
      } catch (e) {
        setBootError(e.message);
        setScreen('select');
      } finally {
        setLoading(false);
      }
    },
    [sessionId, question, selected, markReview, progress, finalizeSession]
  );

  function handleExit() {
    if (tickRef.current) clearInterval(tickRef.current);
    if (window.confirm('Leave this session? Unsaved progress may be lost.')) {
      setScreen('select');
      setSessionId(null);
      setQuestion(null);
      resetSelection();
      navigate('/practice');
    }
  }

  if (screen === 'run' && sessionId) {
    return (
      <TestRunner
        question={question}
        progress={progress}
        elapsedSeconds={elapsed}
        selected={selected}
        setSelected={setSelected}
        markReview={markReview}
        setMarkReview={setMarkReview}
        onSkip={() => submit(true)}
        onNext={() => submit(false)}
        loading={loading}
        adaptiveNote={adaptiveNote}
        onExit={handleExit}
      />
    );
  }

  if (screen === 'results' && results) {
    return (
      <LearningLayout title="Practice results">
        <div className="mx-auto w-full max-w-4xl">
          <p className="mb-4 text-sm text-neutral-600">Adaptive session summary</p>
          <ResultsPanel
            results={results}
            onPracticeAgain={() => {
              setResults(null);
              resetSelection();
              setScreen('select');
            }}
          />
        </div>
      </LearningLayout>
    );
  }

  return (
    <LearningLayout title="Practice test">
      <div className="mx-auto w-full max-w-4xl">
        <p className="mb-4 text-sm text-neutral-600">
          Exam-style flow with adaptive difficulty - stay focused.
        </p>
        <ModeSelection
          activeMode={activeMode}
          setActiveMode={setActiveMode}
          subjects={subjects}
          subjectId={subjectId}
          setSubjectId={setSubjectId}
          topics={topics}
          topic={topic}
          setTopic={setTopic}
          onStart={startSession}
          busy={loading}
          error={bootError}
        />
      </div>
    </LearningLayout>
  );
}
