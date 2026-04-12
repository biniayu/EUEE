import { Suspense } from 'react';
import Spinner from './ui/Spinner.jsx';

/** Phase 14: Suspense boundary for lazy-loaded route pages (charts, heavy views). */
export default function LazyRoute({ children }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-neutral-600">
          <Spinner size="lg" label="Loading page" />
          <p className="text-sm font-medium">Loading…</p>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
