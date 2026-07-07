import { getDestinationCityLabel, getDestinationImage } from '../data/destinationImages';
import { formatRecentDate, formatRecentRoute } from '../lib/recentSearches';
import {
  formatTrackedCabinClass,
  type TrackedDeal,
} from '../lib/trackedDeals';
import { TrackedDealAlertBell } from './TrackedDealAlertBell';

interface TrackedDealCardProps {
  deal: TrackedDeal;
  index?: number;
  activeAlertDealId: string | null;
  onSelect: (deal: TrackedDeal) => void;
  onAlertToggle: (deal: TrackedDeal) => void;
  onRemove?: (deal: TrackedDeal) => void;
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

  return (
    <div
      className={`tracked-deal-card-wrap${className ? ` ${className}` : ''}`}
      style={{ ['--deal-index' as string]: index }}
    >
      <button
        type="button"
        className="trending-deal-card trending-deal-card-btn tracked-deal-card"
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
          <div className="trending-deal-meta">
            <h3 className="trending-deal-city">{city}</h3>
            <p className="trending-deal-meta-route">{route}</p>
            <p className="trending-deal-meta-detail">{dateLabel}</p>
          </div>
          <div className="trending-deal-tags">
            <span className="trending-deal-tag trending-deal-tag-cash">
              {cabinLabel}
            </span>
            {snapshotLabel && (
              <span className="trending-deal-tag trending-deal-tag-points">{snapshotLabel}</span>
            )}
          </div>
        </div>
      </button>
      {onRemove && (
        <button
          type="button"
          className="tracked-deal-remove-btn"
          aria-label={`Stop tracking ${route}`}
          onClick={() => onRemove(deal)}
        >
          ×
        </button>
      )}
    </div>
  );
}
