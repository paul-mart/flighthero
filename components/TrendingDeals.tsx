import { useEffect, useRef, useState } from 'react';
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
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
            Curated award routes — click a deal to search live availability and fares.
          </p>
        </div>

        <div className="trending-deals-feed-grid">
          {deals.map((deal, index) => (
            <article
              key={deal.id}
              className={`trending-deal-card trending-deal-card--feed${visible ? ' trending-deal-card--visible' : ''}`}
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
                <div>
                  <h3 className="trending-deal-city">{deal.city}</h3>
                  <p className="trending-deal-country">
                    {deal.routeLabel} · {deal.country}
                  </p>
                </div>
                <div className="trending-deal-ctas">
                  <button
                    type="button"
                    className="trending-deal-cta trending-deal-cta--primary"
                    onClick={() => onSelectDeal(deal)}
                  >
                    {deal.pointsLabel}
                  </button>
                  <button
                    type="button"
                    className="trending-deal-cta trending-deal-cta--secondary"
                    onClick={() => onSelectDeal(deal)}
                  >
                    {deal.cashLabel}
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
