import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHomeSearchReset } from '../context/HomeSearchContext';
import { FlightHeroLogo } from './FlightHeroLogo';
import { ProfileAvatar } from './ProfileAvatar';

export function TopNavbar() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const resetHomePage = useHomeSearchReset();

  const displayName = profile?.displayName || user?.displayName || '';
  const email = profile?.email || user?.email || '';

  const handleLogoClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname !== '/') return;
    event.preventDefault();
    resetHomePage?.();
  };

  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <Link
          to="/"
          className="top-nav-brand"
          aria-label="FlightHero home"
          onClick={handleLogoClick}
        >
          <FlightHeroLogo variant="nav" />
        </Link>
        <nav className="top-nav-links" aria-label="Main navigation">
          <Link to="/deals" className="top-nav-link">Deals</Link>
          <Link to="/ask-hero" className="top-nav-link">Ask Hero</Link>
          <Link to="/faq" className="top-nav-link">FAQ</Link>
          <Link to="/points-news" className="top-nav-link">Points News</Link>
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
