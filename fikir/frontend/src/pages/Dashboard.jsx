import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx';
import OverviewSection from '../components/dashboard/OverviewSection.jsx';
import SubjectProgressGrid from '../components/dashboard/SubjectProgressGrid.jsx';
import TodayTasksSection from '../components/dashboard/TodayTasksSection.jsx';
import AIRecommendationsSection from '../components/dashboard/AIRecommendationsSection.jsx';
import QuickStatsSection from '../components/dashboard/QuickStatsSection.jsx';

async function fetchJson(path) {
  const res = await fetch(path, { credentials: 'include' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export default function Dashboard() {
  const { logout, fetchMe, user } = useAuth();
  const navigate = useNavigate();

  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState(null);

  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [subjectsError, setSubjectsError] = useState(null);

  const [tasks, setTasks] = useState([]);
  const [tasksEmptyMessage, setTasksEmptyMessage] = useState('');
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState(null);

  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(true);
  const [recError, setRecError] = useState(null);

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const data = await fetchJson('/api/dashboard/overview');
      setOverview(data.overview);
    } catch (e) {
      setOverviewError(e.message);
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const loadSubjects = useCallback(async () => {
    setSubjectsLoading(true);
    setSubjectsError(null);
    try {
      const data = await fetchJson('/api/dashboard/subject-progress');
      setSubjects(data.subjects || []);
    } catch (e) {
      setSubjectsError(e.message);
    } finally {
      setSubjectsLoading(false);
    }
  }, []);

  const loadTasks = useCallback(async () => {
    setTasksLoading(true);
    setTasksError(null);
    try {
      const data = await fetchJson('/api/dashboard/today-tasks');
      setTasks(data.tasks || []);
      setTasksEmptyMessage(data.emptyMessage || '');
    } catch (e) {
      setTasksError(e.message);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  const loadRecommendations = useCallback(async () => {
    setRecLoading(true);
    setRecError(null);
    try {
      const data = await fetchJson('/api/dashboard/recommendations');
      setRecommendations(data.recommendations || []);
    } catch (e) {
      setRecError(e.message);
    } finally {
      setRecLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const data = await fetchJson('/api/dashboard/stats');
      setStats(data.stats);
    } catch (e) {
      setStatsError(e.message);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    loadOverview();
    loadSubjects();
    loadTasks();
    loadRecommendations();
    loadStats();
  }, [loadOverview, loadSubjects, loadTasks, loadRecommendations, loadStats]);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const displayName = overview?.userName || user?.name || 'Student';
  const streakLabel = overview?.streakLabel;
  const notifications = overview?.unreadNotifications ?? 0;

  return (
    <DashboardLayout
      userName={displayName}
      streakLabel={streakLabel}
      notificationCount={notifications}
      onLogout={handleLogout}
    >
      <div className="mx-auto max-w-6xl space-y-8">
        <OverviewSection
          data={overview}
          loading={overviewLoading}
          error={overviewError}
          onRetry={loadOverview}
        />

        <SubjectProgressGrid
          subjects={subjects}
          loading={subjectsLoading}
          error={subjectsError}
          onRetry={loadSubjects}
        />

        <div className="grid gap-8 lg:grid-cols-2">
          <TodayTasksSection
            tasks={tasks}
            emptyMessage={tasksEmptyMessage}
            loading={tasksLoading}
            error={tasksError}
            onRetry={loadTasks}
          />
          <QuickStatsSection
            stats={stats}
            loading={statsLoading}
            error={statsError}
            onRetry={loadStats}
          />
        </div>

        <AIRecommendationsSection
          recommendations={recommendations}
          loading={recLoading}
          error={recError}
          onRetry={loadRecommendations}
        />
      </div>
    </DashboardLayout>
  );
}
