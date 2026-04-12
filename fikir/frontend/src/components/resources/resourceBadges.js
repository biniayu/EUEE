export function badgeClasses(category) {
  const c = (category || '').toLowerCase();
  if (c === 'formula_sheet' || c === 'subject_guide') {
    return 'bg-brand-emerald/15 text-emerald-900 ring-1 ring-brand-emerald/35';
  }
  if (c === 'exam_guide') return 'bg-deep-blue/10 text-deep-blue ring-1 ring-deep-blue/25';
  if (c === 'study_skills') return 'bg-amber-100 text-amber-950 ring-1 ring-amber-300/70';
  return 'bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200';
}
