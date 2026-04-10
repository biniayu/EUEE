import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';

export default function ProtectedRoute({ children }) {
  const { fetchMe } = useAuth();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let active = true;
    (async () => {
      const user = await fetchMe();
      if (!active) return;
      setAllowed(Boolean(user));
      setChecking(false);
    })();
    return () => {
      active = false;
    };
  }, [fetchMe]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
        <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-4 text-sm text-neutral-600 shadow-sm">
          Checking your session...
        </div>
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
