import { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AirportAutocomplete } from '../components/AirportAutocomplete';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { TopNavbar } from '../components/TopNavbar';
import { SiteFooter } from '../components/SiteFooter';
import { TrackedDealCard } from '../components/TrackedDealCard';
import { useAuth } from '../context/AuthContext';
import { useTrackedDeals } from '../context/TrackedDealsContext';
import { extractAirportCode } from '../lib/airportCode';
import { findDealWithAlerts, type TrackedDeal } from '../lib/trackedDeals';
import { TRANSFER_PARTNER_OPTIONS } from '../lib/cpp';
import type { UserProfile } from '../lib/auth';

type ProfileSection = 'settings' | 'preferences' | 'tracked';

const PROFILE_NAV: { id: ProfileSection; label: string }[] = [
  { id: 'settings', label: 'Settings' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'tracked', label: 'Tracked deals' },
];

function buildCppDraft(saved: Record<string, number> = {}): Record<string, number> {
  const draft: Record<string, number> = {};
  for (const partner of TRANSFER_PARTNER_OPTIONS) {
    draft[partner.key] = saved[partner.key] ?? partner.defaultCpp;
  }
  return draft;
}

function cppValuesEqual(
  left: Record<string, number>,
  right: Record<string, number>,
): boolean {
  return TRANSFER_PARTNER_OPTIONS.every((partner) => {
    const leftValue = left[partner.key] ?? partner.defaultCpp;
    const rightValue = right[partner.key] ?? partner.defaultCpp;
    return leftValue === rightValue;
  });
}

function getMemberSinceDate(profile: UserProfile | null, user: User | null): Date | null {
  const createdAt = profile?.createdAt;
  if (createdAt && typeof createdAt === 'object' && 'toDate' in createdAt) {
    return (createdAt as Timestamp).toDate();
  }
  if (user?.metadata?.creationTime) {
    const parsed = new Date(user.metadata.creationTime);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function formatMemberSince(date: Date): string {
  const formatted = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  return `Member since ${formatted}`;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, loading, signOut, updatePreferences } = useAuth();
  const { deals: trackedDeals, removeDeal, setDealAlerts, loading: trackedLoading } = useTrackedDeals();
  const [activeSection, setActiveSection] = useState<ProfileSection>(() => {
    const section = searchParams.get('section');
    return section === 'tracked' ? 'tracked' : 'settings';
  });
  const [signingOut, setSigningOut] = useState(false);
  const [savingPreference, setSavingPreference] = useState(false);
  const [preferenceNotice, setPreferenceNotice] = useState('');
  const [alertPending, setAlertPending] = useState(false);

  const activeAlertDealId = findDealWithAlerts(trackedDeals)?.id ?? null;

  const savedMilitaryTime = profile?.preferences?.militaryZuluTime ?? false;
  const savedCppValuations = profile?.preferences?.cppValuations ?? {};
  const savedHomeAirport = profile?.preferences?.homeAirport ?? '';
  const savedHomeAirportLabel = profile?.preferences?.homeAirportLabel ?? '';

  const [draftMilitaryTime, setDraftMilitaryTime] = useState(savedMilitaryTime);
  const [draftCppValuations, setDraftCppValuations] = useState(() => buildCppDraft(savedCppValuations));
  const [draftHomeAirportLabel, setDraftHomeAirportLabel] = useState(savedHomeAirportLabel);
  const [draftHomeAirport, setDraftHomeAirport] = useState(savedHomeAirport);

  useEffect(() => {
    setDraftMilitaryTime(profile?.preferences?.militaryZuluTime ?? false);
    setDraftCppValuations(buildCppDraft(profile?.preferences?.cppValuations ?? {}));
    setDraftHomeAirportLabel(profile?.preferences?.homeAirportLabel ?? '');
    setDraftHomeAirport(profile?.preferences?.homeAirport ?? '');
  }, [profile?.preferences]);

  useEffect(() => {
    if (searchParams.get('section') === 'tracked') {
      setActiveSection('tracked');
    }
  }, [searchParams]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeSection]);

  const hasPreferenceChanges = useMemo(() => (
    draftMilitaryTime !== savedMilitaryTime
    || !cppValuesEqual(draftCppValuations, savedCppValuations)
    || draftHomeAirportLabel !== savedHomeAirportLabel
    || draftHomeAirport !== savedHomeAirport
  ), [
    draftMilitaryTime,
    savedMilitaryTime,
    draftCppValuations,
    savedCppValuations,
    draftHomeAirportLabel,
    savedHomeAirportLabel,
    draftHomeAirport,
    savedHomeAirport,
  ]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth/sign-in', { replace: true });
    }
  }, [loading, user, navigate]);

  const displayName = profile?.displayName || user?.displayName || 'Your account';
  const email = profile?.email || user?.email || '';
  const memberSinceLabel = useMemo(() => {
    const date = getMemberSinceDate(profile, user);
    return date ? formatMemberSince(date) : '';
  }, [profile, user]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      navigate('/', { replace: true });
    } finally {
      setSigningOut(false);
    }
  };

  const handleSavePreferences = async () => {
    setPreferenceNotice('');

    const label = draftHomeAirportLabel.trim();
    const code = draftHomeAirport || extractAirportCode(label) || '';
    if (label && !code) {
      setPreferenceNotice('Select your home airport from the suggestions list.');
      return;
    }

    const invalidPartner = TRANSFER_PARTNER_OPTIONS.find((partner) => {
      const value = draftCppValuations[partner.key];
      return !Number.isFinite(value) || value <= 0;
    });
    if (invalidPartner) {
      setPreferenceNotice(`Enter a valid cents-per-point value for ${invalidPartner.label}.`);
      return;
    }

    setSavingPreference(true);
    try {
      const notice = await updatePreferences({
        militaryZuluTime: draftMilitaryTime,
        homeAirport: code,
        homeAirportLabel: label,
        cppValuations: Object.fromEntries(
          TRANSFER_PARTNER_OPTIONS.map((partner) => [
            partner.key,
            Math.round((draftCppValuations[partner.key] ?? partner.defaultCpp) * 100) / 100,
          ]),
        ),
      });
      if (notice) {
        setPreferenceNotice(notice);
      } else {
        setPreferenceNotice('Preferences saved.');
      }
    } catch (error) {
      setPreferenceNotice(error instanceof Error ? error.message : 'Could not save your preferences.');
    } finally {
      setSavingPreference(false);
    }
  };

  const handleSearchTrackedDeal = (deal: TrackedDeal) => {
    navigate('/', { state: { resumeTrackedDeal: deal } });
  };

  const handleRemoveTrackedDeal = async (deal: TrackedDeal) => {
    await removeDeal(deal.id);
  };

  const handleToggleAlerts = async (deal: TrackedDeal) => {
    setAlertPending(true);
    try {
      await setDealAlerts(deal.id, !deal.alertsEnabled);
    } finally {
      setAlertPending(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="app-page profile-shell">
        <TopNavbar />
        <div className="profile-body profile-body--loading">
          <p className="profile-loading">Loading your profile…</p>
        </div>
        <SiteFooter />
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
            {memberSinceLabel && <p className="profile-member-since">{memberSinceLabel}</p>}
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

              <div className="profile-premium-section" aria-disabled="true">
                <div className="profile-premium-copy">
                  <h3 className="profile-premium-title">Premium subscription</h3>
                  <p className="profile-premium-description">
                    Track multiple routes for price-drop alerts, advanced notifications, and more.
                  </p>
                </div>
                <button type="button" className="profile-premium-btn" disabled>
                  Coming soon
                </button>
              </div>
            </div>
          )}

          {activeSection === 'preferences' && (
            <div className="profile-preferences">
              <h2 className="profile-panel-title">Preferences</h2>

              <div className="profile-home-airport-field">
                <label className="profile-home-airport-label" htmlFor="home-airport-input">
                  My home airport
                </label>
                <p className="profile-home-airport-description">
                  Used as your default departure airport when you sign in or open the app.
                </p>
                <div className="profile-home-airport-input-wrap">
                  <AirportAutocomplete
                    value={draftHomeAirportLabel}
                    onChange={(value) => {
                      setPreferenceNotice('');
                      setDraftHomeAirportLabel(value);
                      if (!value.trim()) {
                        setDraftHomeAirport('');
                      }
                    }}
                    onSuggestionSelect={(suggestion) => {
                      setDraftHomeAirport(suggestion.code);
                    }}
                    placeholder="Search city or airport"
                    ariaLabel="Home airport"
                    menuAnchorClassName="profile-home-airport-field"
                    variant="profile"
                    inputId="home-airport-input"
                    disabled={savingPreference}
                  />
                </div>
              </div>

              <div className="profile-preference-list">
                <label className="profile-preference-item">
                  <input
                    type="checkbox"
                    className="profile-preference-checkbox"
                    checked={draftMilitaryTime}
                    disabled={savingPreference}
                    onChange={(event) => {
                      setPreferenceNotice('');
                      setDraftMilitaryTime(event.target.checked);
                    }}
                  />
                  <span className="profile-preference-copy">
                    <span className="profile-preference-label">Military time (24-hour)</span>
                    <span className="profile-preference-description">
                      Show flight times in 24-hour format, e.g. 08:30 EST – 14:30 JST.
                    </span>
                  </span>
                </label>
              </div>

              <div className="profile-cpp-section">
                <h3 className="profile-cpp-title">Custom Cent-Per-Point Values</h3>
                <p className="profile-cpp-description">
                  Set your personal cents-per-point (CPP) benchmark for each transfer partner.
                  Redemption grades on award flights compare the flight&apos;s value against these targets.
                </p>
                <div className="profile-cpp-grid">
                  {TRANSFER_PARTNER_OPTIONS.map((partner) => (
                    <label key={partner.key} className="profile-cpp-field">
                      <span className="profile-cpp-label">{partner.label}</span>
                      <span className="profile-cpp-input-wrap">
                        <input
                          type="number"
                          className="profile-cpp-input"
                          min={0.1}
                          max={10}
                          step={0.05}
                          disabled={savingPreference}
                          value={draftCppValuations[partner.key]}
                          onChange={(event) => {
                            setPreferenceNotice('');
                            const parsed = Number.parseFloat(event.target.value);
                            setDraftCppValuations((current) => ({
                              ...current,
                              [partner.key]: Number.isFinite(parsed) ? parsed : current[partner.key],
                            }));
                          }}
                        />
                        <span className="profile-cpp-suffix">¢ / pt</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="profile-preferences-actions">
                <button
                  type="button"
                  className="profile-save-btn"
                  disabled={savingPreference || !hasPreferenceChanges}
                  onClick={() => { void handleSavePreferences(); }}
                >
                  {savingPreference ? 'Saving…' : 'Save preferences'}
                </button>
              </div>

              {preferenceNotice && (
                <p className="profile-preference-notice" role="status">{preferenceNotice}</p>
              )}
            </div>
          )}

          {activeSection === 'tracked' && (
            <div className="profile-tracked">
              <h2 className="profile-panel-title">Tracked award deals</h2>
              <p className="profile-panel-text">
                Saved routes from points searches. Use the bell on one route for daily price-drop emails — free accounts include 1 alert.
              </p>
              {trackedLoading ? (
                <p className="profile-panel-text">Loading tracked deals…</p>
              ) : trackedDeals.length === 0 ? (
                <p className="profile-panel-text">
                  No tracked routes yet. Run a points search and choose &ldquo;Track this route&rdquo; on a result or in flight details.
                </p>
              ) : (
                <div className="profile-tracked-grid trending-deals-grid">
                  {trackedDeals.map((deal, index) => (
                    <TrackedDealCard
                      key={deal.id}
                      deal={deal}
                      index={index}
                      activeAlertDealId={activeAlertDealId}
                      onSelect={handleSearchTrackedDeal}
                      onAlertToggle={(selected) => { void handleToggleAlerts(selected); }}
                      onRemove={(selected) => { void handleRemoveTrackedDeal(selected); }}
                      alertPending={alertPending}
                      className="tracked-deal-card--visible"
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
      <SiteFooter />
    </div>
  );
}
