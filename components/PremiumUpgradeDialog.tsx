import { useEffect, useRef } from 'react';

interface PremiumUpgradeDialogProps {
  onClose: () => void;
}

export function PremiumUpgradeDialog({ onClose }: PremiumUpgradeDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="premium-upgrade-overlay" onClick={onClose}>
      <div
        className="premium-upgrade-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="premium-upgrade-title"
        aria-describedby="premium-upgrade-desc"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="premium-upgrade-title" className="premium-upgrade-title">
          Track more routes with Premium
        </h2>
        <p id="premium-upgrade-desc" className="premium-upgrade-desc">
          Free accounts include one active price-drop alert. Premium (coming soon) unlocks
          multiple route alerts, advanced notifications, and deeper award monitoring.
        </p>
        <div className="premium-upgrade-actions">
          <button
            ref={closeRef}
            type="button"
            className="premium-upgrade-btn premium-upgrade-btn--primary"
            onClick={onClose}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
