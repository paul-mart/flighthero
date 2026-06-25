import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
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
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [alertPending, setAlertPending] = useState(false);

  const activeAlertDealId = findDealWithAlerts(deals)?.id ?? null;

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

  const handleAlertToggle = async (deal: TrackedDeal) => {
    setAlertPending(true);
    try {
      await setDealAlerts(deal.id, !deal.alertsEnabled);
    } finally {
      setAlertPending(false);
    }
  };

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
              Tap the bell on one route for daily price-drop emails. Free accounts include 1 alert — Premium (coming soon) unlocks more.
            </p>
          </div>
          {showManageLink && (
            <Link to="/profile?section=tracked" className="tracked-deals-manage-link">
              Manage
            </Link>
          )}
        </div>
        <div className="trending-deals-grid">
          {deals.map((deal, index) => (
            <TrackedDealCard
              key={deal.id}
              deal={deal}
              index={index}
              activeAlertDealId={activeAlertDealId}
              onSelect={onSelect}
              onAlertToggle={(selected) => { void handleAlertToggle(selected); }}
              onRemove={onRemove}
              alertPending={alertPending}
              className={visible ? 'tracked-deal-card--visible' : ''}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
