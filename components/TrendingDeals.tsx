import { useEffect, useRef, useState } from 'react';
import { DealsCarousel } from './DealsCarousel';
import {
  TRENDING_DEAL_SLIDES,
  type TrendingDeal,
} from '../data/trendingDeals';

interface TrendingDealsProps {
  onSelectDeal: (deal: TrendingDeal) => void;
}

export function TrendingDeals({ onSelectDeal }: TrendingDealsProps) {
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

        <DealsCarousel
          slides={TRENDING_DEAL_SLIDES}
          onSelectDeal={onSelectDeal}
          titleId="trending-deals-title"
        />
      </div>
    </section>
  );
}
