const PALETTE = [
  { border: 'border-deep-blue/40', bg: 'bg-deep-blue/5', chip: 'bg-deep-blue text-white' },
  { border: 'border-brand-emerald/50', bg: 'bg-brand-emerald/5', chip: 'bg-brand-emerald text-white' },
  { border: 'border-amber-400/60', bg: 'bg-amber-50', chip: 'bg-amber-500 text-deep-blue' },
];

const ORDER = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'SAT'];

export function accentForSubject(name) {
  const idx = Math.max(0, ORDER.indexOf(name));
  return PALETTE[idx % PALETTE.length];
}
