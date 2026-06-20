import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTrackedDeals } from '../context/TrackedDealsContext';
import { findTrackedDeal, type TrackedDealInput } from '../lib/trackedDeals';
import { BellIcon } from '../icons';

interface TrackDealButtonProps {
  dealInput: TrackedDealInput;
  className?: string;
}

export function TrackDealButton({ dealInput, className = '' }: TrackDealButtonProps) {
  const { user } = useAuth();
  const { isTracked, saveDeal, removeDeal, deals } = useTrackedDeals();
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState('');

  const tracked = isTracked(dealInput);
  const trackedDeal = findTrackedDeal(deals, dealInput);

  const handleClick = async () => {
    setNotice('');
    if (!user) return;

    setPending(true);
    try {
      if (tracked && trackedDeal) {
        await removeDeal(trackedDeal.id);
        setNotice('Route removed from tracking.');
      } else {
        const error = await saveDeal(dealInput);
        setNotice(error ?? 'Route is now tracked.');
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not update tracking.');
    } finally {
      setPending(false);
    }
  };

  if (!user) {
    return (
      <Link to="/auth/sign-in" className={`track-deal-btn track-deal-btn--sign-in ${className}`.trim()}>
        <BellIcon size={16} />
        Sign in to track
      </Link>
    );
  }

  return (
    <div className={`track-deal-control ${className}`.trim()}>
      <button
        type="button"
        className={`track-deal-btn${tracked ? ' track-deal-btn--tracked' : ''}`}
        onClick={handleClick}
        disabled={pending}
        aria-pressed={tracked}
      >
        <BellIcon size={16} filled={tracked} />
        {pending ? 'Saving…' : tracked ? 'Tracking route' : 'Track this route'}
      </button>
      {notice && <p className="track-deal-notice">{notice}</p>}
    </div>
  );
}
