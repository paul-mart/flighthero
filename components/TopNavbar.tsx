import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FlightHeroLogo } from './FlightHeroLogo';
import { ProfileAvatar } from './ProfileAvatar';

export function TopNavbar() {
  const { user, profile, loading } = useAuth();

  const displayName = profile?.displayName || user?.displayName || '';
  const email = profile?.email || user?.email || '';

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
            <Link
              to="/profile"
              className="top-nav-profile"
              aria-label={`Profile for ${displayName || email}`}
              title={displayName || email || 'Profile'}
            >
              <ProfileAvatar displayName={displayName} email={email} size="nav" />
            </Link>
          ) : (
            <Link to="/auth/sign-in" className="top-nav-sign-in">Sign In</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
