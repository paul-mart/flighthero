import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthShell } from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';
import { getAuthErrorMessage, signUpWithEmail } from '../lib/auth';

function getRedirectPath(state: unknown): string {
  const from = (state as { from?: string } | null)?.from;
  return typeof from === 'string' && from.startsWith('/') ? from : '/';
}

export default function SignUpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = getRedirectPath(location.state);
  const { user, loading: authLoading, configured } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate(redirectTo, { replace: true });
    }
  }, [authLoading, user, navigate, redirectTo]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!configured) {
      setError('Firebase is not configured. Add your Firebase keys to .env.local.');
      return;
    }

    if (!displayName.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await signUpWithEmail(email.trim(), password, displayName.trim());
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <AuthShell title="Create your account" subtitle="Loading…">
        <p className="auth-loading-text">Loading…</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join FlightHero to compare points and cash fares in one place."
    >
      {!configured && (
        <p className="auth-config-notice" role="status">
          Add your Firebase config to <code>.env.local</code> to enable authentication.
        </p>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span className="auth-label">Name</span>
          <input
            type="text"
            className="auth-input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="name"
            placeholder="Your name"
            disabled={submitting}
          />
        </label>

        <label className="auth-field">
          <span className="auth-label">Email</span>
          <input
            type="email"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            required
            disabled={submitting}
          />
        </label>

        <label className="auth-field">
          <span className="auth-label">Password</span>
          <input
            type="password"
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="At least 6 characters"
            required
            minLength={6}
            disabled={submitting}
          />
        </label>

        <label className="auth-field">
          <span className="auth-label">Confirm password</span>
          <input
            type="password"
            className="auth-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            required
            minLength={6}
            disabled={submitting}
          />
        </label>

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="auth-submit"
          disabled={submitting || !configured}
        >
          {submitting ? 'Please wait…' : 'Create Account'}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account?{' '}
        <Link to="/auth/sign-in" className="auth-switch-link">Sign in</Link>
      </p>

    </AuthShell>
  );
}
