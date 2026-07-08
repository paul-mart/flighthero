import { getDestinationCityLabel, getDestinationImage } from '../data/destinationImages';
import { formatRecentDate, formatRecentRoute } from '../lib/recentSearches';
import {
  formatTrackedCabinClass,
  type TrackedDeal,
} from '../lib/trackedDeals';
import { TrashIcon } from '../icons';
import { TrackedDealAlertBell } from './TrackedDealAlertBell';

interface TrackedDealCardProps {
  deal: TrackedDeal;
  index?: number;
  activeAlertDealId: string | null;
  onSelect: (deal: TrackedDeal) => void;
  onAlertToggle: (deal: TrackedDeal) => void;
  onRemove?: (deal: TrackedDeal) => void;
  managing?: boolean;
  alertPending?: boolean;
  className?: string;
}

function formatSnapshotPoints(deal: TrackedDeal): string | null {
  if (!deal.snapshot) return null;
  return `${deal.snapshot.pointsRequired.toLocaleString()} pts`;
}

export function TrackedDealCard({
  deal,
  index = 0,
  activeAlertDealId,
  onSelect,
  onAlertToggle,
  onRemove,
  managing = false,
  alertPending = false,
  className = '',
}: TrackedDealCardProps) {
  const city = getDestinationCityLabel(deal.destination);
  const route = formatRecentRoute(deal.origin, deal.destination, deal.tripType);
  const dateLabel = formatRecentDate({
    ...deal,
    searchType: 'points',
    searchedAt: deal.updatedAt,
  });
  const cabinLabel = formatTrackedCabinClass(deal.cabinClass);
  const snapshotLabel = formatSnapshotPoints(deal);
  const isLiveAlert = deal.alertsEnabled;

  return (
    <div
      className={`tracked-deal-card-wrap${isLiveAlert ? ' tracked-deal-card-wrap--live' : ''}${managing ? ' tracked-deal-card-wrap--managing' : ''}${className ? ` ${className}` : ''}`}
      style={{ ['--deal-index' as string]: index }}
    >
      <button
        type="button"
        className={`trending-deal-card trending-deal-card-btn tracked-deal-card${isLiveAlert ? ' tracked-deal-card--live' : ''}`}
        onClick={() => onSelect(deal)}
      >
        <img
          className="trending-deal-image"
          src={getDestinationImage(deal.destination)}
          alt=""
          loading="lazy"
        />
        <TrackedDealAlertBell
          deal={deal}
          activeAlertDealId={activeAlertDealId}
          disabled={alertPending}
          onToggle={onAlertToggle}
        />
        <div className="trending-deal-overlay" aria-hidden />
        <div className="trending-deal-content">
          {isLiveAlert && (
            <span className="tracked-deal-live-badge">
              <span className="tracked-deal-live-dot" aria-hidden />
              Tracking alerts
            </span>
          )}
          <div className="trending-deal-meta">
            <h3 className="trending-deal-city">{city}</h3>
            <p className="trending-deal-meta-route">{route}</p>
            <p className="trending-deal-meta-detail">{dateLabel}</p>
          </div>
          <div className="tracked-deal-tags">
            <span className="tracked-deal-cabin-tag">{cabinLabel}</span>
            {snapshotLabel && (
              <span className="trending-deal-tag tracked-deal-points-tag">{snapshotLabel}</span>
            )}
          </div>
        </div>
      </button>
      {managing && onRemove && (
        <button
          type="button"
          className="tracked-deal-delete-btn"
          aria-label={`Delete saved route ${route}`}
          onClick={(event) => {
            event.stopPropagation();
            onRemove(deal);
          }}
        >
          <TrashIcon size={16} />
        </button>
      )}
    </div>
  );
}
