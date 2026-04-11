export function badgeClasses(type) {
  const t = (type || 'info').toLowerCase();
  if (t === 'success' || t === 'milestone' || t === 'streak') {
    return 'bg-brand-emerald/15 text-emerald-900 ring-1 ring-brand-emerald/35';
  }
  if (t === 'warning' || t === 'weak_area' || t === 'countdown') {
    return 'bg-amber-100 text-amber-950 ring-1 ring-amber-300/70';
  }
  if (t === 'recommendation' || t === 'info') {
    return 'bg-deep-blue/10 text-deep-blue ring-1 ring-deep-blue/20';
  }
  return 'bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200';
}

export function labelForType(type) {
  const t = (type || 'info').toLowerCase();
  const map = {
    streak: 'Streak',
    weak_area: 'Weak area',
    recommendation: 'Practice',
    milestone: 'Milestone',
    countdown: 'Exam',
    success: 'Success',
    warning: 'Heads up',
    info: 'Info',
  };
  return map[t] || t;
}
