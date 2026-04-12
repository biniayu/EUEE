import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useChatbotPageContext } from '../components/chatbot/ChatbotContext.jsx';
import LearningLayout from '../components/learning/LearningLayout.jsx';
import RangeSelector from '../components/analytics/RangeSelector.jsx';
import MetricGrid from '../components/analytics/MetricGrid.jsx';
import WeakAreasList from '../components/analytics/WeakAreasList.jsx';
import RecentTestsTable from '../components/analytics/RecentTestsTable.jsx';
import PredictionCard from '../components/analytics/PredictionCard.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import ApiErrorAlert from '../components/ui/ApiErrorAlert.jsx';
import { linkBack, pageSection } from '../components/ui/designTokens.js';

/* Phase 14: Lazy-load Chart.js bundle only when analytics data is shown. */
const AnalyticsCharts = lazy(() => import('../components/analytics/AnalyticsCharts.jsx'));

async function fetchJson(path) {
  const res = await fetch(path, { credentials: 'include' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export default function Analytics() {
  const { setPageContext } = useChatbotPageContext();
  const [range, setRange] = useState('week');
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setPageContext({ type: 'analytics' });
    return () => setPageContext({});
  }, [setPageContext]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJson(`/api/analytics?range=${encodeURIComponent(range)}`);
      setPayload(data);
    } catch (e) {
      setError(e.message);
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <LearningLayout title="Performance analytics">
      <div className={pageSection}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link to="/dashboard" className={linkBack}>
              ← Dashboard
            </Link>
            <p className="mt-2 text-sm text-neutral-600">
              Track effort, accuracy, and subject balance — built from your real activity on Fikir.
            </p>
          </div>
          <RangeSelector value={range} onChange={setRange} disabled={loading} />
        </div>

        {loading && (
          <div className="space-y-4" aria-busy="true">
            <Skeleton height="h-28" />
            <Skeleton height="h-80" />
          </div>
        )}

        <ApiErrorAlert
          title="Could not load analytics"
          message={error}
          onRetry={load}
          retryLabel="Retry"
        />

        {!loading && !error && payload && (
          <>
            <div className="rounded-2xl border border-neutral-200/80 bg-white px-4 py-3 shadow-sm">
              <p className="text-sm text-neutral-600">
                Showing <span className="font-bold text-deep-blue">{payload.rangeLabel}</span>
              </p>
            </div>
            <MetricGrid metrics={payload.metrics} />
            <Suspense
              fallback={
                <div className="space-y-4" aria-hidden>
                  <Skeleton height="h-64" />
                  <Skeleton height="h-48" />
                </div>
              }
            >
              <AnalyticsCharts charts={payload.charts} />
            </Suspense>
            <div className="grid gap-6 lg:grid-cols-2">
              <WeakAreasList items={payload.weakAreas} />
              <RecentTestsTable items={payload.recentTests} />
            </div>
            <PredictionCard prediction={payload.prediction} />
          </>
        )}
      </div>
    </LearningLayout>
  );
}
