import { useMemo, useState } from 'react';
import { useRevealOnScroll } from '../lib/useRevealOnScroll';
import { TrackedDealCard } from './TrackedDealCard';
import { useTrackedDeals } from '../context/TrackedDealsContext';
import { findDealWithAlerts, type TrackedDeal } from '../lib/trackedDeals';

interface TrackedDealsSectionProps {
  deals: TrackedDeal[];
  onSelect: (deal: TrackedDeal) => void;
  onRemove?: (deal: TrackedDeal) => void;
  showManageLink?: boolean;
}

export function TrackedDealsSection({
  deals,
  onSelect,
  onRemove,
  showManageLink = true,
}: TrackedDealsSectionProps) {
  const { setDealAlerts } = useTrackedDeals();
  const { ref, visible } = useRevealOnScroll({ threshold: 0.08 });
  const [alertPending, setAlertPending] = useState(false);
  const [managing, setManaging] = useState(false);

  const activeAlertDealId = findDealWithAlerts(deals)?.id ?? null;
  const sortedDeals = useMemo(
    () => [...deals].sort((left, right) => {
      if (left.alertsEnabled && !right.alertsEnabled) return -1;
      if (!left.alertsEnabled && right.alertsEnabled) return 1;
      return right.updatedAt - left.updatedAt;
    }),
    [deals],
  );

  const handleAlertToggle = async (deal: TrackedDeal) => {
    setAlertPending(true);
    try {
      await setDealAlerts(deal.id, !deal.alertsEnabled);
    } finally {
      setAlertPending(false);
    }
  };

  if (deals.length === 0) return null;

  const handleRemove = (deal: TrackedDeal) => {
    onRemove?.(deal);
    if (deals.length <= 1) {
      setManaging(false);
    }
  };

  return (
    <section
      ref={ref}
      className={`tracked-deals-section${visible ? ' tracked-deals-section--visible' : ''}${managing ? ' tracked-deals-section--managing' : ''}`}
      id="tracked-deals"
      aria-labelledby="tracked-deals-title"
    >
      <div className="tracked-deals-inner">
        <div className="tracked-deals-header">
          <div>
            <h2 id="tracked-deals-title" className="tracked-deals-title">
              Saved Award Deals
            </h2>
            <p className="tracked-deals-subtitle">
              Save up to 4 routes on your home page. Use the bell on one route to track it for daily price-drop alerts.
            </p>
          </div>
          {showManageLink && onRemove && (
            <button
              type="button"
              className={`tracked-deals-manage-btn${managing ? ' tracked-deals-manage-btn--active' : ''}`}
              aria-pressed={managing}
              onClick={() => { setManaging((current) => !current); }}
            >
              {managing ? 'Done' : 'Manage'}
            </button>
          )}
        </div>
        <div className="trending-deals-grid">
          {sortedDeals.map((deal, index) => (
            <TrackedDealCard
              key={deal.id}
              deal={deal}
              index={index}
              activeAlertDealId={activeAlertDealId}
              onSelect={onSelect}
              onAlertToggle={(selected) => { void handleAlertToggle(selected); }}
              managing={managing}
              onRemove={onRemove ? handleRemove : undefined}
              alertPending={alertPending}
              className={visible ? 'tracked-deal-card--visible' : ''}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
