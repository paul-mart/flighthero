import { useRevealOnScroll } from '../lib/useRevealOnScroll';
import {
  TRENDING_DEAL_SLIDES,
  type TrendingDeal,
} from '../data/trendingDeals';

interface TrendingDealsProps {
  onSelectDeal: (deal: TrendingDeal) => void;
  maxDeals?: number;
  deals?: TrendingDeal[];
}

const ALL_TRENDING_DEALS = TRENDING_DEAL_SLIDES.flat();

export function TrendingDeals({ onSelectDeal, maxDeals, deals: dealsProp }: TrendingDealsProps) {
  const { ref, visible } = useRevealOnScroll();

  const deals = dealsProp ?? (maxDeals ? ALL_TRENDING_DEALS.slice(0, maxDeals) : ALL_TRENDING_DEALS);

  return (
    <section
      ref={ref}
      className={`trending-deals trending-deals--feed${visible ? ' trending-deals--visible' : ''}`}
      id="deals"
      aria-labelledby="trending-deals-title"
    >
      <div className="trending-deals-inner trending-deals-inner--feed">
        <div className="trending-deals-header">
          <h2 id="trending-deals-title" className="trending-deals-title">
            Trending Award Deals
          </h2>
          <p className="trending-deals-subtitle">
            Curated award routes — click a deal to search live availability.
          </p>
        </div>

        <div className="trending-deals-feed-grid">
          {deals.map((deal, index) => (
            <article
              key={deal.id}
              className={`trending-deal-card trending-deal-card--feed${
                visible ? ' trending-deal-card--visible' : ''
              }`}
              style={{ ['--deal-index' as string]: index % 4 }}
            >
              <img
                className="trending-deal-image"
                src={deal.image}
                alt=""
                loading="lazy"
              />
              <div className="trending-deal-overlay" aria-hidden />
              <div className="trending-deal-content">
                <div className="trending-deal-meta">
                  <h3 className="trending-deal-city">{deal.city}</h3>
                  <p className="trending-deal-meta-route">{deal.routeLabel}</p>
                  <p className="trending-deal-meta-detail">{deal.detailLabel}</p>
                </div>
                <div className="trending-deal-tags">
                  <button
                    type="button"
                    className="trending-deal-tag trending-deal-tag-points"
                    onClick={() => onSelectDeal(deal)}
                  >
                    {deal.pointsLabel}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
