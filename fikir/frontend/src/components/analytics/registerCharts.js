import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

let registered = false;

export function registerAnalyticsCharts() {
  if (registered) return;
  registered = true;
  ChartJS.defaults.font.family = "'Inter', ui-sans-serif, system-ui, sans-serif";
  ChartJS.defaults.color = '#525252';
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    RadialLinearScale,
    Tooltip,
    Legend,
    Filler
  );
}
