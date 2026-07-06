import { useCallback, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export function AskHeroSignInGate() {
  const navigate = useNavigate();
  const signInRef = useRef<HTMLAnchorElement>(null);

  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    signInRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        goBack();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [goBack]);

  return (
    <div className="ask-hero-gate-overlay" role="presentation">
      <div
        className="ask-hero-gate-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ask-hero-gate-title"
        aria-describedby="ask-hero-gate-desc"
      >
        <button
          type="button"
          className="ask-hero-gate-back"
          onClick={goBack}
        >
          ← Back
        </button>
        <h2 id="ask-hero-gate-title" className="ask-hero-gate-title">
          Sign in to use Ask Hero
        </h2>
        <p id="ask-hero-gate-desc" className="ask-hero-gate-desc">
          Ask Hero is our AI travel advisor — plan routes, compare redemptions, and spot deals using
          your home airport and points goals. Create a free FlightHero account to get started.
        </p>
        <div className="ask-hero-gate-actions">
          <Link
            ref={signInRef}
            to="/auth/sign-in"
            state={{ from: '/ask-hero' }}
            className="ask-hero-gate-btn ask-hero-gate-btn--primary"
          >
            Sign in
          </Link>
          <Link
            to="/auth/sign-up"
            state={{ from: '/ask-hero' }}
            className="ask-hero-gate-btn ask-hero-gate-btn--secondary"
          >
            Create account
          </Link>
        </div>
        <p className="ask-hero-gate-footnote">
          Free to join — save searches, track deals, and chat with Ask Hero anytime.
        </p>
      </div>
    </div>
  );
}
