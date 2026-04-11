import { Line, Bar, Pie, Radar } from 'react-chartjs-2';
import { registerAnalyticsCharts } from './registerCharts.js';

const DEEP = '#001f3f';
const EMERALD = '#10b981';
const AMBER = '#f59e0b';
const MUTED = ['#0ea5e9', '#8b5cf6', '#ec4899', '#64748b'];

export default function AnalyticsCharts({ charts }) {
  registerAnalyticsCharts();
  const c = charts || {};
  const trend = c.scoreTrend || [];
  const bySub = c.performanceBySubject || [];
  const timeSub = c.timeBySubject || [];
  const skills = c.skillLevels || [];

  const lineData = {
    labels: trend.map((t) => t.date),
    datasets: [
      {
        label: 'Daily accuracy %',
        data: trend.map((t) => (t.scorePercent != null ? t.scorePercent : null)),
        borderColor: EMERALD,
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        fill: true,
        tension: 0.35,
        spanGaps: true,
      },
    ],
  };

  const barData = {
    labels: bySub.map((r) => r.subjectName),
    datasets: [
      {
        label: 'Accuracy %',
        data: bySub.map((r) => r.accuracyPercent ?? 0),
        backgroundColor: bySub.map((_, i) => MUTED[i % MUTED.length]),
        borderRadius: 8,
      },
    ],
  };

  const pieTotal = timeSub.reduce((s, r) => s + (r.minutes || 0), 0);
  const pieData = {
    labels: timeSub.map((r) => r.subjectName),
    datasets: [
      {
        data: timeSub.map((r) => r.minutes || 0),
        backgroundColor: [DEEP, EMERALD, AMBER, ...MUTED],
        borderWidth: 0,
      },
    ],
  };

  const radarData = {
    labels: skills.map((s) => s.subjectName),
    datasets: [
      {
        label: 'Skill (accuracy proxy)',
        data: skills.map((s) => s.score ?? 0),
        borderColor: DEEP,
        backgroundColor: 'rgba(0, 31, 63, 0.15)',
        pointBackgroundColor: EMERALD,
      },
    ],
  };

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom' },
    },
  };

  const radarOpts = {
    ...chartOpts,
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: { stepSize: 20 },
      },
    },
  };

  const totalAttempts = bySub.reduce((s, r) => s + (r.attempts || 0), 0);
  const emptyTrend = trend.length === 0;
  const emptyBar = totalAttempts === 0;
  const emptyPie = pieTotal <= 0;
  const emptyRadar = totalAttempts === 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-bold text-deep-blue">Score trend</h3>
        <p className="text-xs text-neutral-500">Daily accuracy from attempts</p>
        <div className="mt-4 h-64">
          {emptyTrend ? (
            <p className="flex h-full items-center justify-center text-sm text-neutral-500">
              No attempts in this range yet.
            </p>
          ) : (
            <Line data={lineData} options={{ ...chartOpts, scales: { y: { min: 0, max: 100 } } }} />
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-bold text-deep-blue">Performance by subject</h3>
        <p className="text-xs text-neutral-500">Accuracy in selected period</p>
        <div className="mt-4 h-64">
          {emptyBar ? (
            <p className="flex h-full items-center justify-center text-sm text-neutral-500">
              No subject attempts yet.
            </p>
          ) : (
            <Bar
              data={barData}
              options={{
                ...chartOpts,
                scales: { y: { min: 0, max: 100, title: { display: true, text: '%' } } },
              }}
            />
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-bold text-deep-blue">Time by subject</h3>
        <p className="text-xs text-neutral-500">Lesson minutes + estimated practice</p>
        <div className="mt-4 h-64">
          {emptyPie ? (
            <p className="flex h-full items-center justify-center text-sm text-neutral-500">
              No study time recorded in this range.
            </p>
          ) : (
            <Pie
              data={pieData}
              options={{
                ...chartOpts,
                plugins: { ...chartOpts.plugins, tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw} min` } } },
              }}
            />
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-bold text-deep-blue">Subject skill profile</h3>
        <p className="text-xs text-neutral-500">Accuracy as a 0–100 snapshot</p>
        <div className="mt-4 h-64">
          {emptyRadar ? (
            <p className="flex h-full items-center justify-center text-sm text-neutral-500">
              Build more attempts to see your radar.
            </p>
          ) : (
            <Radar data={radarData} options={radarOpts} />
          )}
        </div>
      </div>
    </div>
  );
}
