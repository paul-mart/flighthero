import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { formatRecentDate, formatRecentRoute } from '../lib/recentSearches';
import type { TrackedDeal, TrackedDealInput } from '../lib/trackedDeals';
import { MAX_TRACKED_DEALS } from '../lib/trackedDeals';

type TrackRouteDialogMode = 'prompt' | 'switch-alert' | 'at-limit';

interface TrackRouteDialogProps {
  dealInput: TrackedDealInput;
  activeAlertDeal?: TrackedDeal;
  mode: TrackRouteDialogMode;
  pending: boolean;
  onCancel: () => void;
  onTrackWithAlert: () => void;
  onTrackWithoutAlert: () => void;
}

function buildRouteSummary(dealInput: TrackedDealInput): { route: string; dates: string } {
  return {
    route: formatRecentRoute(dealInput.origin, dealInput.destination, dealInput.tripType),
    dates: formatRecentDate({
      ...dealInput,
      searchType: 'points',
      searchedAt: Date.now(),
    }),
  };
}

export function TrackRouteDialog({
  dealInput,
  activeAlertDeal,
  mode,
  pending,
  onCancel,
  onTrackWithAlert,
  onTrackWithoutAlert,
}: TrackRouteDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const { route, dates } = buildRouteSummary(dealInput);
  const activeAlertRoute = activeAlertDeal
    ? formatRecentRoute(activeAlertDeal.origin, activeAlertDeal.destination, activeAlertDeal.tripType)
    : '';

  useEffect(() => {
    cancelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pending) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, pending]);

  const title = mode === 'at-limit'
    ? 'Save limit reached'
    : mode === 'switch-alert'
      ? 'Switch alert tracking?'
      : 'Save this route?';

  return createPortal(
    <div
      className="track-route-dialog-overlay"
      onClick={pending ? undefined : onCancel}
    >
      <div
        className="track-route-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="track-route-dialog-title"
        aria-describedby="track-route-dialog-desc"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="track-route-dialog-title" className="track-route-dialog-title">
          {title}
        </h2>
        <div id="track-route-dialog-desc" className="track-route-dialog-desc">
          {mode === 'at-limit' ? (
            <p>
              You can save up to {MAX_TRACKED_DEALS} routes. Remove one from your home page
              or profile to add this route.
            </p>
          ) : (
            <>
              <p className="track-route-dialog-route">{route}</p>
              <p className="track-route-dialog-dates">{dates}</p>
              {mode === 'switch-alert' ? (
                <p>
                  You&apos;re already tracking alerts on{' '}
                  <span className="track-route-dialog-emphasis">{activeAlertRoute}</span>.
                  Free accounts include one alert — switch tracking to this route, or save
                  this route without alerts.
                </p>
              ) : (
                <p>
                  Save this route to your home page. You can also track it for daily
                  price-drop email alerts.
                </p>
              )}
            </>
          )}
        </div>
        <div className="track-route-dialog-actions">
          {mode === 'at-limit' ? (
            <button
              ref={cancelRef}
              type="button"
              className="track-route-dialog-btn track-route-dialog-btn--primary"
              onClick={onCancel}
            >
              OK
            </button>
          ) : (
            <>
              <button
                ref={cancelRef}
                type="button"
                className="track-route-dialog-btn track-route-dialog-btn--cancel"
                onClick={onCancel}
                disabled={pending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="track-route-dialog-btn track-route-dialog-btn--secondary"
                onClick={onTrackWithoutAlert}
                disabled={pending}
              >
                {pending ? 'Saving…' : 'Save without alerts'}
              </button>
              <button
                type="button"
                className="track-route-dialog-btn track-route-dialog-btn--primary"
                onClick={onTrackWithAlert}
                disabled={pending}
              >
                {pending
                  ? 'Saving…'
                  : mode === 'switch-alert'
                    ? 'Track alerts here'
                    : 'Save & track alerts'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
