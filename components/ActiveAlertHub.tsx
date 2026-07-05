import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BellIcon } from '../icons';
import { formatRecentDate, formatRecentRoute } from '../lib/recentSearches';
import {
  formatTrackedCabinClass,
  type TrackedDeal,
} from '../lib/trackedDeals';
import { PremiumUpgradeDialog } from './PremiumUpgradeDialog';

interface ActiveAlertHubProps {
  isSignedIn: boolean;
  activeDeal: TrackedDeal | undefined;
  onOpenDeal: (deal: TrackedDeal) => void;
  variant?: 'card' | 'strip';
}

function formatLastChecked(deal: TrackedDeal): string {
  const timestamp = deal.lastCheckedAt ?? deal.updatedAt;
  if (!timestamp) {
    return 'Monitoring daily price drops';
  }
  const checked = new Date(timestamp);
  return `Last checked ${checked.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })}`;
}

function formatSnapshot(deal: TrackedDeal): string | null {
  if (!deal.snapshot) return null;
  return `${deal.snapshot.pointsRequired.toLocaleString()} pts baseline`;
}

export function ActiveAlertHub({
  isSignedIn,
  activeDeal,
  onOpenDeal,
  variant = 'card',
}: ActiveAlertHubProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const isStrip = variant === 'strip';
  const hubClassName = `active-alert-hub${isStrip ? ' active-alert-hub--strip' : ''}`;

  return (
    <>
      <div className={hubClassName}>
        {!isStrip ? (
          <h2 className="active-alert-hub-title">Your Active Alert</h2>
        ) : (
          <h2 className="active-alert-hub-title active-alert-hub-title--strip">Your Active Alert</h2>
        )}

        {!isSignedIn ? (
          <div className={`active-alert-hub-empty${isStrip ? ' active-alert-hub-empty--strip' : ''}`}>
            {!isStrip ? (
              <div className="active-alert-hub-empty-icon" aria-hidden>
                <BellIcon size={28} />
              </div>
            ) : (
              <span className="active-alert-hub-empty-icon active-alert-hub-empty-icon--strip" aria-hidden>
                <BellIcon size={18} />
              </span>
            )}
            <div className="active-alert-hub-empty-copy-block">
              <h3 className="active-alert-hub-empty-title">Sign in to set up alerts</h3>
              {!isStrip ? (
                <p className="active-alert-hub-empty-copy">
                  Create a free account to monitor one award route for price drops.
                </p>
              ) : null}
            </div>
            <Link to="/auth/sign-in" className="active-alert-hub-cta active-alert-hub-cta--strip">
              Sign in
            </Link>
          </div>
        ) : activeDeal ? (
          <div className={`active-alert-banner${isStrip ? ' active-alert-banner--strip' : ''}`}>
            <div className={`active-alert-banner-left${isStrip ? ' active-alert-banner-left--strip' : ''}`}>
              <span className="active-alert-card-status">
                <span className="active-alert-card-status-dot" aria-hidden />
                Alert active
              </span>
              {isStrip ? (
                <>
                  <span className="active-alert-strip-route">
                    {formatRecentRoute(activeDeal.origin, activeDeal.destination)}
                  </span>
                  <span className="active-alert-strip-meta">
                    {formatRecentDate({
                      ...activeDeal,
                      searchType: 'points',
                      searchedAt: activeDeal.updatedAt,
                    })}
                    {' · '}
                    {formatTrackedCabinClass(activeDeal.cabinClass)}
                    {' · '}
                    {formatLastChecked(activeDeal)}
                    {formatSnapshot(activeDeal) ? ` · ${formatSnapshot(activeDeal)}` : ''}
                  </span>
                </>
              ) : (
                <>
                  <p className="active-alert-card-route">
                    {formatRecentRoute(activeDeal.origin, activeDeal.destination)}
                  </p>
                  <p className="active-alert-card-meta">
                    {formatRecentDate({
                      ...activeDeal,
                      searchType: 'points',
                      searchedAt: activeDeal.updatedAt,
                    })}
                    {' · '}
                    {formatTrackedCabinClass(activeDeal.cabinClass)}
                  </p>
                  <p className="active-alert-card-check">{formatLastChecked(activeDeal)}</p>
                  {formatSnapshot(activeDeal) ? (
                    <p className="active-alert-card-snapshot">{formatSnapshot(activeDeal)}</p>
                  ) : null}
                </>
              )}
            </div>
            <div className="active-alert-banner-actions">
              <button
                type="button"
                className="active-alert-banner-search-link"
                onClick={() => onOpenDeal(activeDeal)}
              >
                Search route →
              </button>
              <button
                type="button"
                className="active-alert-hub-upgrade-btn"
                onClick={() => setShowUpgrade(true)}
              >
                Track a second route
              </button>
            </div>
          </div>
        ) : (
          <div className={`active-alert-hub-empty${isStrip ? ' active-alert-hub-empty--strip' : ''}`}>
            {!isStrip ? (
              <div className="active-alert-hub-empty-icon" aria-hidden>
                <BellIcon size={28} />
              </div>
            ) : (
              <span className="active-alert-hub-empty-icon active-alert-hub-empty-icon--strip" aria-hidden>
                <BellIcon size={18} />
              </span>
            )}
            <div className="active-alert-hub-empty-copy-block">
              <h3 className="active-alert-hub-empty-title">No active alert yet</h3>
              {!isStrip ? (
                <p className="active-alert-hub-empty-copy">
                  Search for award flights, then tap the bell on a result to start monitoring.
                </p>
              ) : null}
            </div>
            <a
              href="#deals"
              className="active-alert-hub-cta active-alert-hub-cta--secondary active-alert-hub-cta--strip"
            >
              Browse trending deals
            </a>
          </div>
        )}
      </div>

      {showUpgrade ? (
        <PremiumUpgradeDialog onClose={() => setShowUpgrade(false)} />
      ) : null}
    </>
  );
}
