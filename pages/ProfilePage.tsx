import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { TopNavbar } from '../components/TopNavbar';
import { useAuth } from '../context/AuthContext';

type ProfileSection = 'settings' | 'preferences';

const PROFILE_NAV: { id: ProfileSection; label: string }[] = [
  { id: 'settings', label: 'Settings' },
  { id: 'preferences', label: 'Preferences' },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, loading, signOut, updatePreferences } = useAuth();
  const [activeSection, setActiveSection] = useState<ProfileSection>('settings');
  const [signingOut, setSigningOut] = useState(false);
  const [savingPreference, setSavingPreference] = useState(false);
  const [preferenceNotice, setPreferenceNotice] = useState('');

  const militaryZuluTime = profile?.preferences?.militaryZuluTime ?? false;

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth/sign-in', { replace: true });
    }
  }, [loading, user, navigate]);

  const displayName = profile?.displayName || user?.displayName || 'Your account';
  const email = profile?.email || user?.email || '';

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      navigate('/', { replace: true });
    } finally {
      setSigningOut(false);
    }
  };

  const handleMilitaryZuluToggle = async (enabled: boolean) => {
    setPreferenceNotice('');
    setSavingPreference(true);
    try {
      const notice = await updatePreferences({ militaryZuluTime: enabled });
      if (notice) {
        setPreferenceNotice(notice);
      }
    } catch (error) {
      setPreferenceNotice(error instanceof Error ? error.message : 'Could not save your preference. Please try again.');
    } finally {
      setSavingPreference(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="app-page profile-shell">
        <TopNavbar />
        <div className="profile-body profile-body--loading">
          <p className="profile-loading">Loading your profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page profile-shell">
      <TopNavbar />
      <div className="profile-body">
        <aside className="profile-sidebar" aria-label="Profile navigation">
        <header className="profile-sidebar-header">
          <ProfileAvatar
            displayName={displayName}
            email={email}
            size="profile"
          />
          <div className="profile-header-text">
            <h1 id="profile-title" className="profile-title">{displayName}</h1>
            {email && <p className="profile-email">{email}</p>}
          </div>
        </header>

        <nav className="profile-nav" aria-label="Profile sections">
          {PROFILE_NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`profile-nav-item${activeSection === item.id ? ' profile-nav-item-active' : ''}`}
              aria-current={activeSection === item.id ? 'page' : undefined}
              onClick={() => setActiveSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="profile-nav-footer">
          <button
            type="button"
            className="profile-log-out"
            onClick={() => { void handleSignOut(); }}
            disabled={signingOut}
          >
            {signingOut ? 'Signing out…' : 'Log out'}
          </button>
        </div>
      </aside>

      <div className="profile-main" aria-labelledby="profile-title">
        <header className="profile-main-header">
          <Link to="/" className="profile-back-link">← Back to search</Link>
        </header>

        <div className="profile-panel">
          {activeSection === 'settings' && (
            <div className="profile-settings">
              <h2 className="profile-panel-title">Account settings</h2>
              <dl className="profile-field-list">
                <div className="profile-field">
                  <dt>Name</dt>
                  <dd>{displayName}</dd>
                </div>
                <div className="profile-field">
                  <dt>Email</dt>
                  <dd>{email || '—'}</dd>
                </div>
              </dl>
            </div>
          )}

          {activeSection === 'preferences' && (
            <div className="profile-preferences">
              <h2 className="profile-panel-title">Preferences</h2>
              <div className="profile-preference-list">
                <label className="profile-preference-item">
                  <input
                    type="checkbox"
                    className="profile-preference-checkbox"
                    checked={militaryZuluTime}
                    disabled={savingPreference}
                    onChange={(event) => { void handleMilitaryZuluToggle(event.target.checked); }}
                  />
                  <span className="profile-preference-copy">
                    <span className="profile-preference-label">Military and Zulu time</span>
                    <span className="profile-preference-description">
                      Show flight times in 24-hour format with Zulu (UTC), e.g. 0830 EST (1230Z).
                    </span>
                  </span>
                </label>
              </div>
              {preferenceNotice && (
                <p className="profile-preference-notice" role="status">{preferenceNotice}</p>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
