import { useRevealOnScroll } from '../lib/useRevealOnScroll';
import {
  formatRecentCashLabel,
  formatRecentDate,
  formatRecentPointsLabel,
  formatRecentRoute,
  type RecentSearch,
} from '../lib/recentSearches';

interface ContinueSearchingProps {
  searches: RecentSearch[];
  onSelect: (search: RecentSearch, searchType: 'cash' | 'points') => void;
}

export function ContinueSearching({ searches, onSelect }: ContinueSearchingProps) {
  const { ref, visible } = useRevealOnScroll({ threshold: 0.08 });

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
        <div className="trending-deals-feed-grid">
          {searches.map((search, index) => {
            const city = getDestinationCityLabel(search.destination);
            const route = formatRecentRoute(search.origin, search.destination, search.tripType);
            const dateLabel = formatRecentDate(search);
            return (
              <article
                key={`${search.searchedAt}-${route}-${dateLabel}`}
                className={`trending-deal-card trending-deal-card--feed continue-search-card${
                  visible ? ' trending-deal-card--visible' : ''
                }`}
                style={{ ['--deal-index' as string]: index % 4 }}
              >
                <img
                  className="trending-deal-image"
                  src={getDestinationImage(search.destination)}
                  alt=""
                  loading="lazy"
                />
                <div className="trending-deal-overlay" aria-hidden />
                <div className="trending-deal-content">
                  <div className="trending-deal-meta">
                    <h3 className="trending-deal-city">{city}</h3>
                    <p className="trending-deal-meta-route">{route}</p>
                    <p className="trending-deal-meta-detail">{dateLabel}</p>
                  </div>
                  <div className="trending-deal-tags">
                    <button
                      type="button"
                      className="trending-deal-tag trending-deal-tag-points"
                      onClick={() => onSelect(search, 'points')}
                    >
                      {formatRecentPointsLabel(search.lowestPoints)}
                    </button>
                    <button
                      type="button"
                      className="trending-deal-tag trending-deal-tag-cash"
                      onClick={() => onSelect(search, 'cash')}
                    >
                      {formatRecentCashLabel(search.lowestCash)}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
