import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useChatbotPageContext } from '../components/chatbot/ChatbotContext.jsx';
import LearningLayout from '../components/learning/LearningLayout.jsx';
import PlanSummaryStrip from '../components/studyplan/PlanSummaryStrip.jsx';
import GeneratePlanPanel from '../components/studyplan/GeneratePlanPanel.jsx';
import WeekCalendar from '../components/studyplan/WeekCalendar.jsx';
import TaskSwapBar from '../components/studyplan/TaskSwapBar.jsx';
import ApiErrorAlert from '../components/ui/ApiErrorAlert.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';

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

function isStudyPlanPayload(out) {
  return out && out.success === true && out.summary && typeof out.summary === 'object';
}

export default function StudyPlan() {
  const { setPageContext } = useChatbotPageContext();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setPageContext({ type: 'study_plan' });
    return () => setPageContext({});
  }, [setPageContext]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiJson('/api/studyplan');
      setPayload(data);
    } catch (e) {
      setError(e.message);
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const applyServerPayload = (out) => {
    if (isStudyPlanPayload(out)) setPayload(out);
    else load();
  };

  const handleGenerate = async (body) => {
    setGenerating(true);
    setError(null);
    try {
      const out = await apiJson('/api/studyplan/generate', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      applyServerPayload(out);
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleComplete = async (taskId) => {
    setBusy(true);
    setError(null);
    try {
      await apiJson('/api/studyplan/task/complete', {
        method: 'POST',
        body: JSON.stringify({ taskId }),
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleMoveDay = async (taskId, day) => {
    setBusy(true);
    setError(null);
    try {
      const out = await apiJson('/api/studyplan/adjust', {
        method: 'PUT',
        body: JSON.stringify({ moves: [{ taskId, day }] }),
      });
      applyServerPayload(out);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDurationChange = async (taskId, durationMinutes) => {
    setBusy(true);
    setError(null);
    try {
      const out = await apiJson('/api/studyplan/adjust', {
        method: 'PUT',
        body: JSON.stringify({ durationUpdates: [{ taskId, durationMinutes }] }),
      });
      applyServerPayload(out);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSwap = async (taskIdA, taskIdB) => {
    setBusy(true);
    setError(null);
    try {
      const out = await apiJson('/api/studyplan/adjust', {
        method: 'PUT',
        body: JSON.stringify({ swaps: [{ taskIdA, taskIdB }] }),
      });
      applyServerPayload(out);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const plan = payload?.plan;
  const summary = payload?.summary;
  const hasPlan = payload?.hasActivePlan && plan;

  return (
    <LearningLayout title="Study plan">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link to="/dashboard" className="text-sm font-semibold text-brand-emerald hover:text-deep-blue">
              ← Dashboard
            </Link>
            <p className="mt-2 max-w-2xl text-sm text-neutral-600">
              Your personal academic advisor: a balanced week that respects weak areas, EUEE weighting, and
              the progress you already log in Fikir.
            </p>
          </div>
          {hasPlan && plan.generatedAt && (
            <p className="text-xs text-neutral-500">
              Last generated: {new Date(plan.generatedAt).toLocaleString()}
            </p>
          )}
        </div>

        {loading && (
          <div className="space-y-4" aria-busy="true">
            <Skeleton height="h-24" className="w-full" />
            <Skeleton height="h-64" className="w-full" />
          </div>
        )}

        <ApiErrorAlert title="Could not load study plan" message={error} onRetry={load} retryLabel="Retry" />

        {!loading && payload && (
          <>
            <GeneratePlanPanel
              onGenerate={handleGenerate}
              generating={generating}
              initialExamDate={plan?.examTargetDate || undefined}
            />

            {hasPlan && (
              <>
                <PlanSummaryStrip summary={summary} plan={plan} />

                {plan.planSummary && (
                  <div className="rounded-2xl border border-brand-emerald/25 bg-brand-emerald/5 px-5 py-4 text-sm text-neutral-800">
                    <p className="font-semibold text-deep-blue">Advisor summary</p>
                    <p className="mt-2 leading-relaxed">{plan.planSummary}</p>
                  </div>
                )}

                <section>
                  <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-bold text-deep-blue">Weekly calendar</h2>
                    <p className="text-xs text-neutral-500">
                      Monday–Sunday · Drag-free edits: change day, minutes, or swap two tasks.
                    </p>
                  </div>
                  <WeekCalendar
                    tasksByDay={plan.tasksByDay}
                    onComplete={handleComplete}
                    onMoveDay={handleMoveDay}
                    onDurationChange={handleDurationChange}
                    busy={busy}
                  />
                </section>

                <TaskSwapBar tasks={plan.tasks} onSwap={handleSwap} busy={busy} />
              </>
            )}

            {!hasPlan && !loading && (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/60 px-6 py-10 text-center">
                <p className="text-sm font-medium text-deep-blue">No active study plan yet</p>
                <p className="mt-2 text-sm text-neutral-600">
                  Set your exam date and weekly hours above, then generate — we will pull your real diagnostics,
                  weak areas, and lesson progress from the database.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </LearningLayout>
  );
}
