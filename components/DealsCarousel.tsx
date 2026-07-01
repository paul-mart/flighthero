import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../icons';
import type { TrendingDeal } from '../data/trendingDeals';

interface DealsCarouselProps {
  slides: TrendingDeal[][];
  onSelectDeal: (deal: TrendingDeal) => void;
  titleId?: string;
}

export function DealsCarousel({
  slides,
  onSelectDeal,
  titleId,
}: DealsCarouselProps) {
  const [slideIndex, setSlideIndex] = useState(0);
  const slideCount = slides.length;

  const goToPrevious = () => {
    setSlideIndex((index) => (index - 1 + slideCount) % slideCount);
  };

  const goToNext = () => {
    setSlideIndex((index) => (index + 1) % slideCount);
  };

  return (
    <>
      <div className="trending-deals-carousel">
        <button
          type="button"
          className="trending-deals-nav trending-deals-nav--prev"
          onClick={goToPrevious}
          aria-label="Show previous deals"
        >
          <ChevronLeftIcon size={28} />
        </button>

        <div
          className="trending-deals-carousel-viewport"
          aria-live="polite"
          aria-labelledby={titleId}
          aria-label={`Deal set ${slideIndex + 1} of ${slideCount}`}
        >
          <div
            className="trending-deals-carousel-track"
            style={{ transform: `translateX(-${slideIndex * 100}%)` }}
          >
            {slides.map((deals, slideIdx) => (
              <div key={slideIdx} className="trending-deals-slide">
                <div className="trending-deals-grid">
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
                          <p className="trending-deal-country">
                            {deal.routeLabel} · {deal.country}
                          </p>
                        </div>
                        <div className="trending-deal-tags">
                          <span className="trending-deal-tag trending-deal-tag-points">
                            {deal.pointsLabel}
                          </span>
                          <span className="trending-deal-tag trending-deal-tag-cash">
                            {deal.cashLabel}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="trending-deals-nav trending-deals-nav--next"
          onClick={goToNext}
          aria-label="Show next deals"
        >
          <ChevronRightIcon size={28} />
        </button>
      </div>

      <p className="trending-deals-slide-indicator" aria-hidden>
        {slideIndex + 1} / {slideCount}
      </p>
    </>
  );
}
