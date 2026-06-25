import { BellIcon } from '../icons';
import type { TrackedDeal } from '../lib/trackedDeals';
import {
  PRICE_ALERT_TOOLTIP_ACTIVE,
  PRICE_ALERT_TOOLTIP_AVAILABLE,
  PRICE_ALERT_TOOLTIP_SWITCH,
} from '../lib/trackedDeals';

interface TrackedDealAlertBellProps {
  deal: TrackedDeal;
  activeAlertDealId: string | null;
  disabled?: boolean;
  onToggle: (deal: TrackedDeal) => void;
}

function getTooltip(deal: TrackedDeal, activeAlertDealId: string | null): string {
  if (deal.alertsEnabled) {
    return PRICE_ALERT_TOOLTIP_ACTIVE;
  }
  if (activeAlertDealId && activeAlertDealId !== deal.id) {
    return PRICE_ALERT_TOOLTIP_SWITCH;
  }
  return PRICE_ALERT_TOOLTIP_AVAILABLE;
}

export function TrackedDealAlertBell({
  deal,
  activeAlertDealId,
  disabled = false,
  onToggle,
}: TrackedDealAlertBellProps) {
  const isActive = deal.alertsEnabled;
  const isBlocked = Boolean(activeAlertDealId && activeAlertDealId !== deal.id);
  const tooltip = getTooltip(deal, activeAlertDealId);

  return (
    <div className="tracked-deal-alert-bell-wrap">
      <button
        type="button"
        className={`tracked-deal-alert-bell${isActive ? ' tracked-deal-alert-bell--active' : ''}${isBlocked ? ' tracked-deal-alert-bell--blocked' : ''}`}
        aria-label={isActive ? 'Turn off price-drop alerts' : 'Notify me when prices drop'}
        aria-pressed={isActive}
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation();
          onToggle(deal);
        }}
      >
        <BellIcon size={16} filled={isActive} />
      </button>
      <span className="tracked-deal-alert-bell-tooltip" role="tooltip">
        {tooltip}
      </span>
    </div>
  );
}
