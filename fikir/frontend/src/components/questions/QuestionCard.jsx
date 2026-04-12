import { memo } from 'react';
import { btnPrimary } from '../ui/designTokens.js';

function difficultyBadge(diff) {
  const d = (diff || 'medium').toLowerCase();
  if (d === 'easy') return 'bg-brand-emerald/15 text-emerald-800 ring-1 ring-brand-emerald/30';
  if (d === 'hard') return 'bg-amber-100 text-amber-900 ring-1 ring-amber-300/60';
  return 'bg-deep-blue/10 text-deep-blue ring-1 ring-deep-blue/20';
}

function QuestionCard({ q, viewMode, onView }) {
  const isList = viewMode === 'list';

  return (
    <article
      className={`flex rounded-2xl border border-neutral-200/90 bg-white shadow-sm transition hover:border-brand-emerald/40 hover:shadow-md ${
        isList ? 'flex-row items-stretch gap-4 p-4' : 'flex-col p-4'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-brand-emerald">{q.subjectName}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${difficultyBadge(q.difficulty)}`}>
            {q.difficulty || 'medium'}
          </span>
          {q.isFavorite && (
            <span className="text-amber-500" title="Favorite" aria-label="Favorite">
              ★
            </span>
          )}
        </div>
        <p className="mt-2 text-sm font-medium leading-snug text-neutral-900">{q.preview}</p>
        <p className="mt-1 text-xs text-neutral-500">Topic: {q.topic}</p>
      </div>
      <div className={`flex shrink-0 items-center ${isList ? '' : 'mt-4 justify-end'}`}>
        <button type="button" onClick={() => onView(q.id)} className={`${btnPrimary} px-4 py-2 text-xs`}>
          View
        </button>
      </div>
    </article>
  );
}

export default memo(QuestionCard);
