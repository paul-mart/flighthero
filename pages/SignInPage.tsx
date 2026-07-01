import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';
import { getAuthErrorMessage, signInWithEmail, signInWithGoogle } from '../lib/auth';
import { publicUrl } from '../lib/publicUrl';

export default function SignInPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, configured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/', { replace: true });
    }
  }, [authLoading, user, navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!configured) {
      setError('Firebase is not configured. Add your Firebase keys to .env.local.');
      return;
    }

    setSubmitting(true);
    try {
      await signInWithEmail(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');

    if (!configured) {
      setError('Firebase is not configured. Add your Firebase keys to .env.local.');
      return;
    }

    setSubmitting(true);
    try {
      await signInWithGoogle();
      navigate('/', { replace: true });
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <AuthShell title="Welcome back" subtitle="Loading your account…">
        <p className="auth-loading-text">Loading…</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to save searches and track award deals."
    >
      {!configured && (
        <p className="auth-config-notice" role="status">
          Add your Firebase config to <code>.env.local</code> to enable authentication.
        </p>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
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

        <div className="auth-password-block">
          <label className="auth-field">
            <span className="auth-label">Password</span>
            <input
              type="password"
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Your password"
              required
              minLength={6}
              disabled={submitting}
            />
          </label>
          <p className="auth-forgot-row">
            <Link to="/auth/forgot-password" className="auth-forgot-link">Forgot password?</Link>
          </p>
        </div>

        <p className="auth-divider-label">or</p>

        <button
          type="button"
          className="auth-google-btn"
          onClick={handleGoogleSignIn}
          disabled={submitting || !configured}
        >
          <img
            className="auth-google-icon"
            src={publicUrl('auth/google-g.svg')}
            alt=""
            width={18}
            height={18}
          />
          Sign in with Google
        </button>

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
          {submitting ? 'Please wait…' : 'Sign In'}
        </button>
      </form>

      <p className="auth-switch">
        Don&apos;t have an account?{' '}
        <Link to="/auth/sign-up" className="auth-switch-link">Sign up</Link>
      </p>

    </AuthShell>
  );
}
