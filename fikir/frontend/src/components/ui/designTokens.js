/**
 * Phase 14: Shared Tailwind patterns for visual consistency (cards, buttons, focus).
 * Prefer importing these instead of duplicating long class strings across pages.
 */
export const cardBase =
  'rounded-2xl border border-neutral-200/90 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md';

export const cardSubtle =
  'rounded-2xl border border-neutral-200/80 bg-white/95 shadow-sm backdrop-blur-sm';

export const btnPrimary =
  'inline-flex items-center justify-center rounded-full bg-deep-blue px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-deep-blue/15 transition hover:bg-[#002a52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

export const btnSecondary =
  'inline-flex items-center justify-center rounded-full border border-deep-blue bg-white px-4 py-2.5 text-sm font-semibold text-deep-blue transition hover:bg-deep-blue/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald focus-visible:ring-offset-2';

export const btnEmerald =
  'inline-flex items-center justify-center rounded-full bg-brand-emerald px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-blue focus-visible:ring-offset-2 disabled:opacity-50';

export const linkBack =
  'text-sm font-semibold text-brand-emerald transition-colors hover:text-deep-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald rounded';

export const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald focus-visible:ring-offset-2';

export const pageSection = 'mx-auto max-w-6xl space-y-8';
