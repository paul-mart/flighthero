import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { HeroFlightResult } from '../lib/askHero';
import { qualityFromCpp } from '../lib/askHero';
import { openFlightSearchInNewTab } from '../lib/searchUrl';
import { saveTrackedDeal, updateTrackedDealAlerts } from '../lib/trackedDeals';
import { useAuth } from '../context/AuthContext';

interface HeroResultCardProps {
  result: HeroFlightResult;
}

function formatCabin(cabin: string): string {
  const labels: Record<string, string> = {
    economy: 'Economy',
    'premium-economy': 'Premium economy',
    business: 'Business',
    first: 'First',
  };
  return labels[cabin] ?? cabin;
}

export function HeroResultCard({ result }: HeroResultCardProps) {
  const { user } = useAuth();
  const [alertPending, setAlertPending] = useState(false);
  const [alertNotice, setAlertNotice] = useState('');
  const quality = qualityFromCpp(result.cpp);
  const qualityClass = quality.toLowerCase();

  const handleSearch = () => {
    openFlightSearchInNewTab({
      origin: result.origin,
      destination: result.destination,
      departureDate: result.departureDate || '',
      returnDate: result.returnDate || '',
      tripType: result.tripType || 'one-way',
      searchType: 'points',
      cabinClass: result.cabinClass || 'business',
      adults: 1,
      childrenCount: 0,
    });
  };

  const handleSetAlert = async () => {
    if (!user) return;
    setAlertPending(true);
    setAlertNotice('');
    try {
      const departureDate = result.departureDate || new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10);
      const { deal, error } = await saveTrackedDeal(user.uid, {
        origin: result.origin,
        destination: result.destination,
        departureDate,
        returnDate: result.returnDate || '',
        tripType: result.tripType || 'one-way',
        cabinClass: result.cabinClass || 'business',
        adults: 1,
        childrenCount: 0,
        snapshot: {
          pointsRequired: result.pointsCost,
          taxesAndFees: result.taxesAndFees ?? 0,
          mileageProgram: result.program,
          carrier: result.airline,
        },
      });
      if (error) {
        setAlertNotice(error);
        return;
      }
      const { error: alertError } = await updateTrackedDealAlerts(user.uid, deal.id, true);
      setAlertNotice(alertError ?? 'Price alert set for this route.');
    } catch (err) {
      setAlertNotice(err instanceof Error ? err.message : 'Could not set alert.');
    } finally {
      setAlertPending(false);
    }
  };

  return (
    <article className="hero-result-card">
      <div className="hero-result-card-header">
        <span className="hero-result-route">
          {result.origin} → {result.destination}
        </span>
        <span className={`hero-result-quality hero-result-quality--${qualityClass}`}>
          {quality}
        </span>
      </div>
      <div className="hero-result-meta">
        <span>{formatCabin(result.cabinClass)}</span>
        {result.airline && <span>{result.airline}</span>}
        {result.program && <span>{result.program}</span>}
      </div>
      <div className="hero-result-pricing">
        <span className="hero-result-points">
          {result.pointsCost.toLocaleString()} pts
        </span>
        {result.cpp != null && (
          <span className="hero-result-cpp">{result.cpp.toFixed(2)}¢/pt</span>
        )}
        {result.taxesAndFees != null && result.taxesAndFees > 0 && (
          <span className="hero-result-taxes">
            + ${Math.round(result.taxesAndFees)} taxes
          </span>
        )}
      </div>
      <div className="hero-result-actions">
        {user ? (
          <button
            type="button"
            className="hero-result-btn hero-result-btn--secondary"
            onClick={handleSetAlert}
            disabled={alertPending}
          >
            {alertPending ? 'Setting…' : 'Set Alert'}
          </button>
        ) : (
          <Link to="/auth/sign-in" className="hero-result-btn hero-result-btn--secondary">
            Set Alert
          </Link>
        )}
        <button
          type="button"
          className="hero-result-btn hero-result-btn--primary"
          onClick={handleSearch}
        >
          Search
        </button>
      </div>
      {alertNotice && <p className="hero-result-notice">{alertNotice}</p>}
    </article>
  );
}
