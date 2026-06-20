import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDestinationCityLabel, getDestinationImage } from '../data/destinationImages';
import { formatRecentDate, formatRecentRoute } from '../lib/recentSearches';
import type { TrackedDeal } from '../lib/trackedDeals';

interface TrackedDealsSectionProps {
  deals: TrackedDeal[];
  onSelect: (deal: TrackedDeal) => void;
  onRemove?: (deal: TrackedDeal) => void;
  showManageLink?: boolean;
}

function formatSnapshotPoints(deal: TrackedDeal): string | null {
  if (!deal.snapshot) return null;
  return `${deal.snapshot.pointsRequired.toLocaleString()} pts`;
}

export function TrackedDealsSection({
  deals,
  onSelect,
  onRemove,
  showManageLink = true,
}: TrackedDealsSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (deals.length === 0) return null;

  return (
    <section
      ref={ref}
      className={`tracked-deals-section${visible ? ' tracked-deals-section--visible' : ''}`}
      id="tracked-deals"
      aria-labelledby="tracked-deals-title"
    >
      <div className="tracked-deals-inner">
        <div className="tracked-deals-header">
          <div>
            <h2 id="tracked-deals-title" className="tracked-deals-title">
              Tracked Award Deals
            </h2>
            <p className="tracked-deals-subtitle">
              Routes you are watching — search again to check latest availability
            </p>
          </div>
          {showManageLink && (
            <Link to="/profile?section=tracked" className="tracked-deals-manage-link">
              Manage
            </Link>
          )}
        </div>
        <div className="trending-deals-grid">
          {deals.map((deal, index) => {
            const city = getDestinationCityLabel(deal.destination);
            const route = formatRecentRoute(deal.origin, deal.destination);
            const dateLabel = formatRecentDate({
              ...deal,
              searchType: 'points',
              searchedAt: deal.updatedAt,
            });
            const snapshotLabel = formatSnapshotPoints(deal);
            return (
              <div
                key={deal.id}
                className="tracked-deal-card-wrap"
                style={{ ['--deal-index' as string]: index }}
              >
                <button
                  type="button"
                  className="trending-deal-card tracked-deal-card"
                  onClick={() => onSelect(deal)}
                >
                  <img
                    className="trending-deal-image"
                    src={getDestinationImage(deal.destination)}
                    alt=""
                    loading="lazy"
                  />
                  <div className="trending-deal-overlay" aria-hidden />
                  <div className="trending-deal-content">
                    <div>
                      <h3 className="trending-deal-city">{route}</h3>
                      <p className="trending-deal-country">{city}</p>
                    </div>
                    <div className="trending-deal-tags">
                      <span className="trending-deal-tag continue-search-date-tag">{dateLabel}</span>
                      {snapshotLabel && (
                        <span className="trending-deal-tag tracked-deal-points-tag">{snapshotLabel}</span>
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
          })}
        </div>
      </div>
    </section>
  );
}
