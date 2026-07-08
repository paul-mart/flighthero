import { LockIcon } from '../icons';

interface AlertHubPremiumUpsellProps {
  onOpenPremium: () => void;
}

export function AlertHubPremiumUpsell({ onOpenPremium }: AlertHubPremiumUpsellProps) {
  return (
    <button
      type="button"
      className="alert-hub-premium-upsell"
      onClick={onOpenPremium}
      aria-label="Track an additional route with Premium — opens subscription settings"
    >
      <span className="alert-hub-premium-upsell-copy">+ Track an additional route</span>
      <span className="alert-hub-premium-badge">
        <LockIcon size={12} />
        Premium
      </span>
    </button>
  );
}
