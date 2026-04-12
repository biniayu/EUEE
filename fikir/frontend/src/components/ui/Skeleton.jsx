import { memo } from 'react';

/** Phase 14: Pulse skeleton blocks for list/card loading states. */
function SkeletonComponent({ className = '', height = 'h-24', rounded = 'rounded-2xl' }) {
  return (
    <div
      className={`animate-pulse bg-neutral-100 ${height} ${rounded} ${className}`}
      aria-hidden
    />
  );
}

export default memo(SkeletonComponent);
