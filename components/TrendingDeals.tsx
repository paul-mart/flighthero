import { useEffect, useRef, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../icons';
import {
  TRENDING_DEAL_SLIDE_COUNT,
  TRENDING_DEAL_SLIDES,
  type TrendingDeal,
} from '../data/trendingDeals';

interface TrendingDealsProps {
  onSelectDeal: (deal: TrendingDeal) => void;
}

export function TrendingDeals({ onSelectDeal }: TrendingDealsProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

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

  const goToPrevious = () => {
    setSlideIndex((index) => (index - 1 + TRENDING_DEAL_SLIDE_COUNT) % TRENDING_DEAL_SLIDE_COUNT);
  };

  const goToNext = () => {
    setSlideIndex((index) => (index + 1) % TRENDING_DEAL_SLIDE_COUNT);
  };

  const deals = TRENDING_DEAL_SLIDES[slideIndex];

  return (
    <section
      ref={ref}
      className={`trending-deals${visible ? ' trending-deals--visible' : ''}`}
      id="deals"
      aria-labelledby="trending-deals-title"
    >
      <div className="trending-deals-inner">
        <div className="trending-deals-header">
          <h2 id="trending-deals-title" className="trending-deals-title">Trending Deals</h2>
          <p className="trending-deals-subtitle">
            Curated award routes — click a deal to search live availability and fares
          </p>
        </div>

        <div className="trending-deals-carousel">
          <button
            type="button"
            className="trending-deals-nav trending-deals-nav--prev"
            onClick={goToPrevious}
            aria-label="Show previous deals"
          >
            <ChevronLeftIcon size={20} />
          </button>

          <div
            className="trending-deals-grid"
            key={slideIndex}
            aria-live="polite"
            aria-label={`Deal set ${slideIndex + 1} of ${TRENDING_DEAL_SLIDE_COUNT}`}
          >
            {deals.map((deal, index) => (
              <button
                key={deal.id}
                type="button"
                className="trending-deal-card trending-deal-card-btn"
                style={{ ['--deal-index' as string]: index }}
                onClick={() => onSelectDeal(deal)}
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
                    <p className="trending-deal-country">{deal.routeLabel} · {deal.country}</p>
                  </div>
                  <div className="trending-deal-tags">
                    <span className="trending-deal-tag trending-deal-tag-points">{deal.pointsLabel}</span>
                    <span className="trending-deal-tag trending-deal-tag-cash">{deal.cashLabel}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="trending-deals-nav trending-deals-nav--next"
            onClick={goToNext}
            aria-label="Show next deals"
          >
            <ChevronRightIcon size={20} />
          </button>
        </div>

        <p className="trending-deals-slide-indicator" aria-hidden>
          {slideIndex + 1} / {TRENDING_DEAL_SLIDE_COUNT}
        </p>
      </div>
    </section>
  );
}
