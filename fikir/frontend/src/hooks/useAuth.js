import { useCallback, useState } from 'react';

const DEV_TOKEN_KEY = 'fikir_dev_token';

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async ({ email, password, remember }) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, remember }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return { success: false, error: data.error || 'Invalid credentials' };
      }

      // Dev simulation for eventual httpOnly cookie-only auth.
      if (data.token) {
        localStorage.setItem(DEV_TOKEN_KEY, data.token);
      } else {
        localStorage.setItem(DEV_TOKEN_KEY, 'cookie-session');
      }

      if (data.user) {
        setUser(data.user);
      }
      return { success: true, message: data.message || 'Login successful!' };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (payload) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return { success: false, error: data.error || 'Signup failed.' };
      }

      return { success: true, message: data.message || 'Account created successfully' };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return null;
      setUser(data.user || null);
      return data.user || null;
    } catch {
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      localStorage.removeItem(DEV_TOKEN_KEY);
      setUser(null);
    }
  }, []);

  return { user, loading, login, signup, fetchMe, logout };
}
