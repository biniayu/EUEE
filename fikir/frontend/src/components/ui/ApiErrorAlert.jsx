import { memo } from 'react';
import { btnPrimary } from './designTokens.js';

/**
 * Phase 14: Consistent API error UI with retry (role="alert" for screen readers).
 */
function ApiErrorAlertComponent({ title = 'Something went wrong', message, onRetry, retryLabel = 'Try again' }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-900 shadow-sm"
    >
      <p className="font-semibold text-red-950">{title}</p>
      <p className="mt-1 text-sm text-red-900/90">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={`mt-4 ${btnPrimary}`}>
          {retryLabel}
        </button>
      )}
    </div>
  );
}

export default memo(ApiErrorAlertComponent);
