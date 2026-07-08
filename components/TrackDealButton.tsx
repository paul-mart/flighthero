import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTrackedDeals } from '../context/TrackedDealsContext';
import {
  findDealWithAlerts,
  findTrackedDeal,
  isAtTrackedDealLimit,
  type TrackedDealInput,
} from '../lib/trackedDeals';
import { BellIcon } from '../icons';
import { TrackRouteDialog } from './TrackRouteDialog';

interface TrackDealButtonProps {
  dealInput: TrackedDealInput;
  className?: string;
}

type DialogMode = 'prompt' | 'switch-alert' | 'at-limit';

export function TrackDealButton({ dealInput, className = '' }: TrackDealButtonProps) {
  const { user } = useAuth();
  const { isTracked, saveDeal, removeDeal, deals } = useTrackedDeals();
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState('');
  const [dialogMode, setDialogMode] = useState<DialogMode | null>(null);

  const tracked = isTracked(dealInput);
  const trackedDeal = findTrackedDeal(deals, dealInput);
  const activeAlertDeal = findDealWithAlerts(deals);

  const closeDialog = () => {
    if (!pending) {
      setDialogMode(null);
    }
  };

  const persistDeal = async (alertsEnabled: boolean) => {
    setPending(true);
    setNotice('');
    try {
      const error = await saveDeal({
        ...dealInput,
        alertsEnabled,
      });
      if (error) {
        setNotice(error);
        return;
      }
      setNotice(
        alertsEnabled
          ? 'Route saved — tracking price-drop alerts.'
          : 'Route saved to your home page.',
      );
      setDialogMode(null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not update saved route.');
    } finally {
      setPending(false);
    }
  };

  const handleClick = async () => {
    setNotice('');
    if (!user) return;

    if (tracked && trackedDeal) {
      setPending(true);
      try {
        await removeDeal(trackedDeal.id);
        setNotice('Route removed from saved routes.');
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'Could not update saved route.');
      } finally {
        setPending(false);
      }
      return;
    }

    if (isAtTrackedDealLimit(deals, dealInput)) {
      setDialogMode('at-limit');
      return;
    }

    if (activeAlertDeal) {
      setDialogMode('switch-alert');
      return;
    }

    setDialogMode('prompt');
  };

  if (!user) {
    return (
      <Link to="/auth/sign-in" className={`track-deal-btn track-deal-btn--sign-in ${className}`.trim()}>
        <BellIcon size={16} />
        Sign in to save routes
      </Link>
    );
  }

  return (
    <>
      <div className={`track-deal-control ${className}`.trim()}>
        <button
          type="button"
          className={`track-deal-btn${tracked ? ' track-deal-btn--tracked' : ''}`}
          onClick={() => { void handleClick(); }}
          disabled={pending}
          aria-pressed={tracked}
        >
          <BellIcon size={16} filled={tracked} />
          {pending ? 'Saving…' : tracked ? 'Saved' : 'Save route'}
        </button>
        {notice && <p className="track-deal-notice">{notice}</p>}
      </div>

      {dialogMode && (
        <TrackRouteDialog
          dealInput={dealInput}
          activeAlertDeal={activeAlertDeal}
          mode={dialogMode}
          pending={pending}
          onCancel={closeDialog}
          onTrackWithAlert={() => { void persistDeal(true); }}
          onTrackWithoutAlert={() => { void persistDeal(false); }}
        />
      )}
    </>
  );
}
