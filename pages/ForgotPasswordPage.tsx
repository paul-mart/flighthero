import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';
import { getAuthErrorMessage, sendPasswordReset } from '../lib/auth';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, configured } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
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
      await sendPasswordReset(email.trim());
      setSubmitted(true);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <AuthShell title="Reset password" subtitle="Loading…">
        <p className="auth-loading-text">Loading…</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="Enter the email for your account and we'll send you a link to choose a new password."
    >
      {!configured && (
        <p className="auth-config-notice" role="status">
          Add your Firebase config to <code>.env.local</code> to enable authentication.
        </p>
      )}

      {submitted ? (
        <div className="auth-success" role="status">
          <p className="auth-success-title">Check your email</p>
          <p className="auth-success-text">
            If an account exists for <strong>{email.trim()}</strong>, we sent a password reset link.
            It may take a few minutes to arrive — please check your spam or junk folder too.
          </p>
          <Link to="/auth/sign-in" className="auth-submit auth-submit--link">
            Back to sign in
          </Link>
        </div>
      ) : (
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
            {submitting ? 'Please wait…' : 'Send reset link'}
          </button>
        </form>
      )}

      {!submitted && (
        <p className="auth-switch">
          Remember your password?{' '}
          <Link to="/auth/sign-in" className="auth-switch-link">Sign in</Link>
        </p>
      )}

      <p className="auth-footer">
        <Link to="/" className="auth-back-link">← Back to search</Link>
      </p>
    </AuthShell>
  );
}
