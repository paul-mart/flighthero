import { TrashIcon } from '../icons';
import { getDestinationCityLabel } from '../data/destinationImages';
import { formatRecentDate, formatRecentRoute } from '../lib/recentSearches';
import {
  formatTrackedCabinClass,
  type TrackedDeal,
} from '../lib/trackedDeals';

interface AlertHubRowProps {
  deal: TrackedDeal;
  alertPending?: boolean;
  onToggleAlerts: (deal: TrackedDeal) => void;
  onRemove: (deal: TrackedDeal) => void;
  onSelect?: (deal: TrackedDeal) => void;
}

function formatLastChecked(timestamp?: number): string {
  if (!timestamp) return 'Last checked: Pending';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Last checked: Pending';
  return `Last checked: ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

export function AlertHubRow({
  deal,
  alertPending = false,
  onToggleAlerts,
  onRemove,
  onSelect,
}: AlertHubRowProps) {
  const route = formatRecentRoute(deal.origin, deal.destination, deal.tripType);
  const city = getDestinationCityLabel(deal.destination);
  const dateLabel = formatRecentDate({
    ...deal,
    searchType: 'points',
    searchedAt: deal.updatedAt,
  });
  const cabinLabel = formatTrackedCabinClass(deal.cabinClass);
  const alertsActive = Boolean(deal.alertsEnabled);
  const lastCheckedLabel = formatLastChecked(deal.lastCheckedAt ?? deal.updatedAt);

  return (
    <article className="alert-hub-row">
      <div className="alert-hub-row-left">
        <div className="alert-hub-row-path-line">
          <span
            className={`alert-hub-status-badge${alertsActive ? '' : ' alert-hub-status-badge--paused'}`}
            aria-hidden
          />
          {onSelect ? (
            <button
              type="button"
              className="alert-hub-route-btn"
              onClick={() => onSelect(deal)}
            >
              {route}
            </button>
          ) : (
            <span className="alert-hub-route">{route}</span>
          )}
        </div>
        <p className="alert-hub-row-meta">
          {city} • {dateLabel} • {cabinLabel}
        </p>
      </div>

      <p className="alert-hub-row-checked">{lastCheckedLabel}</p>

      <div className="alert-hub-row-actions">
        <button
          type="button"
          role="switch"
          aria-checked={alertsActive}
          aria-label={alertsActive ? 'Pause price-drop alerts' : 'Enable price-drop alerts'}
          className={`alert-hub-toggle${alertsActive ? ' alert-hub-toggle--on' : ''}`}
          disabled={alertPending}
          onClick={() => onToggleAlerts(deal)}
        >
          <span className="alert-hub-toggle-track" aria-hidden>
            <span className="alert-hub-toggle-thumb" />
          </span>
          <span className="alert-hub-toggle-label">
            {alertsActive ? 'Alerts on' : 'Alerts paused'}
          </span>
        </button>

        <button
          type="button"
          className="alert-hub-remove-btn"
          aria-label={`Remove ${route} from tracked routes`}
          onClick={() => onRemove(deal)}
        >
          <TrashIcon size={18} />
        </button>
      </div>
    </article>
  );
}
