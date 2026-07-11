import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHomeSearchReset } from '../context/HomeSearchContext';
import { FlightHeroLogo } from './FlightHeroLogo';
import { ProfileAvatar } from './ProfileAvatar';

const NAV_LINKS = [
  { to: '/deals', label: 'Deals' },
  { to: '/ask-hero', label: 'Ask Hero' },
  { to: '/points-guide', label: 'Points Guide' },
  { to: '/faq', label: 'FAQ' },
  { to: '/points-news', label: 'Points News' },
] as const;

export function TopNavbar() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const resetHomePage = useHomeSearchReset();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const displayName = profile?.displayName || user?.displayName || '';
  const email = profile?.email || user?.email || '';

  const handleLogoClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname !== '/') return;
    event.preventDefault();
    resetHomePage?.();
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const mobileOverlay = mobileMenuOpen ? createPortal(
    <>
      <button
        type="button"
        className="top-nav-backdrop"
        aria-label="Close navigation menu"
        onClick={closeMobileMenu}
      />
      <nav
        id="top-nav-drawer"
        className="top-nav-drawer top-nav-drawer--open"
        aria-label="Mobile navigation"
      >
        <ul className="top-nav-drawer-list">
          {NAV_LINKS.map(({ to, label }) => (
            <li key={to}>
              <Link
                to={to}
                className="top-nav-drawer-link"
                onClick={closeMobileMenu}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>,
    document.body,
  ) : null;

  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <button
          type="button"
          className="top-nav-menu-toggle"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="top-nav-drawer"
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
        <Link
          to="/"
          className="top-nav-brand"
          aria-label="FlightHero home"
          onClick={handleLogoClick}
        >
          <FlightHeroLogo variant="nav" />
        </Link>
        <div className="top-nav-actions">
          <nav className="top-nav-links" aria-label="Main navigation">
            <div className="top-nav-text-links">
              {NAV_LINKS.map(({ to, label }) => (
                <Link key={to} to={to} className="top-nav-link">
                  {label}
                </Link>
              ))}
            </div>
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
      </div>
      {mobileOverlay}
    </header>
  );
}
