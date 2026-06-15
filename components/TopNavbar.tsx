import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FlightHeroLogo } from './FlightHeroLogo';

export function TopNavbar() {
  const { user, profile, loading, signOut } = useAuth();

  const userLabel = profile?.displayName || user?.email || '';

  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <Link to="/" className="top-nav-brand" aria-label="FlightHero home">
          <FlightHeroLogo variant="nav" />
        </Link>
        <nav className="top-nav-links" aria-label="Main navigation">
          <a href="/#deals" className="top-nav-link">Deals</a>
          <a href="/#explore" className="top-nav-link">Explore</a>
          <a href="/#points-guide" className="top-nav-link">Points Guide</a>
          {!loading && user ? (
            <>
              <span className="top-nav-user" title={user.email ?? undefined}>
                {userLabel}
              </span>
              <button
                type="button"
                className="top-nav-sign-out"
                onClick={() => { void signOut(); }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/auth/sign-in" className="top-nav-sign-in">Sign In</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
