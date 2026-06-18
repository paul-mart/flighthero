import { useEffect, useRef, useState } from 'react';
import { getDestinationCityLabel, getDestinationImage } from '../data/destinationImages';
import {
  formatRecentDate,
  formatRecentRoute,
  type RecentSearch,
} from '../lib/recentSearches';

interface ContinueSearchingProps {
  searches: RecentSearch[];
  onSelect: (search: RecentSearch) => void;
}

export function ContinueSearching({ searches, onSelect }: ContinueSearchingProps) {
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

  if (searches.length === 0) return null;

  return (
    <section
      ref={ref}
      className={`continue-searching${visible ? ' continue-searching--visible' : ''}`}
      id="continue-searching"
      aria-labelledby="continue-searching-title"
    >
      <div className="continue-searching-inner">
        <div className="continue-searching-header">
          <h2 id="continue-searching-title" className="continue-searching-title">
            Continue Searching
          </h2>
          <p className="continue-searching-subtitle">Pick up where you left off</p>
        </div>
        <div className="trending-deals-grid">
          {searches.map((search, index) => {
            const city = getDestinationCityLabel(search.destination);
            const route = formatRecentRoute(search.origin, search.destination);
            const dateLabel = formatRecentDate(search);
            return (
              <button
                key={`${search.searchedAt}-${route}-${dateLabel}`}
                type="button"
                className="trending-deal-card continue-search-card"
                style={{ ['--deal-index' as string]: index }}
                onClick={() => onSelect(search)}
              >
                <img
                  className="trending-deal-image"
                  src={getDestinationImage(search.destination)}
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
                    <span className="trending-deal-tag continue-search-type-tag">
                      {search.searchType === 'points' ? 'Points' : 'Cash'}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
