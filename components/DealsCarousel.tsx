import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../icons';
import type { TrendingDeal } from '../data/trendingDeals';

interface DealsCarouselProps {
  slides: TrendingDeal[][];
  onSelectDeal: (deal: TrendingDeal) => void;
  titleId?: string;
  title?: string;
  subtitle?: string;
  navPlacement?: 'sides' | 'header';
  showSlideIndicator?: boolean;
}

function CarouselNavButtons({
  onPrevious,
  onNext,
  variant,
}: {
  onPrevious: () => void;
  onNext: () => void;
  variant: 'sides' | 'header';
}) {
  const navClass = variant === 'header'
    ? 'trending-deals-nav trending-deals-nav--header'
    : 'trending-deals-nav';

  return (
    <>
      <button
        type="button"
        className={`${navClass} trending-deals-nav--prev`}
        onClick={onPrevious}
        aria-label="Show previous deals"
      >
        <ChevronLeftIcon size={variant === 'header' ? 20 : 28} />
      </button>
      <button
        type="button"
        className={`${navClass} trending-deals-nav--next`}
        onClick={onNext}
        aria-label="Show next deals"
      >
        <ChevronRightIcon size={variant === 'header' ? 20 : 28} />
      </button>
    </>
  );
}

function DealCardsGrid({
  slides,
  slideIndex,
  onSelectDeal,
}: {
  slides: TrendingDeal[][];
  slideIndex: number;
  onSelectDeal: (deal: TrendingDeal) => void;
}) {
  return (
    <div
      className="trending-deals-carousel-viewport"
      aria-live="polite"
      aria-label={`Deal set ${slideIndex + 1} of ${slides.length}`}
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
                    <div className="trending-deal-meta">
                      <h3 className="trending-deal-city">{deal.city}</h3>
                      <p className="trending-deal-meta-route">{deal.routeLabel}</p>
                      <p className="trending-deal-meta-detail">{deal.detailLabel}</p>
                    </div>
                    <div className="trending-deal-tags">
                      <span className="trending-deal-tag trending-deal-tag-points">
                        {deal.pointsLabel}
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
  );
}

export function DealsCarousel({
  slides,
  onSelectDeal,
  titleId,
  title,
  subtitle,
  navPlacement = 'sides',
  showSlideIndicator,
}: DealsCarouselProps) {
  const [slideIndex, setSlideIndex] = useState(0);
  const slideCount = slides.length;
  const headerNav = navPlacement === 'header';
  const indicatorVisible = showSlideIndicator ?? !headerNav;

  const goToPrevious = () => {
    setSlideIndex((index) => (index - 1 + slideCount) % slideCount);
  };

  const goToNext = () => {
    setSlideIndex((index) => (index + 1) % slideCount);
  };

  if (headerNav && title) {
    return (
      <div className="trending-deals-carousel-block trending-deals-carousel-block--header-nav">
        <div className="trending-deals-header-row">
          <div className="trending-deals-header-copy">
            <h2 id={titleId} className="trending-deals-title">{title}</h2>
            {subtitle ? (
              <p className="trending-deals-subtitle">{subtitle}</p>
            ) : null}
          </div>
          <div className="trending-deals-header-controls" aria-label="Carousel navigation">
            <CarouselNavButtons
              onPrevious={goToPrevious}
              onNext={goToNext}
              variant="header"
            />
          </div>
        </div>

        <DealCardsGrid
          slides={slides}
          slideIndex={slideIndex}
          onSelectDeal={onSelectDeal}
        />
      </div>
    );
  }

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

        <DealCardsGrid
          slides={slides}
          slideIndex={slideIndex}
          onSelectDeal={onSelectDeal}
        />

        <button
          type="button"
          className="trending-deals-nav trending-deals-nav--next"
          onClick={goToNext}
          aria-label="Show next deals"
        >
          <ChevronRightIcon size={28} />
        </button>
      </div>

      {indicatorVisible ? (
        <p className="trending-deals-slide-indicator" aria-hidden>
          {slideIndex + 1} / {slideCount}
        </p>
      ) : null}
    </>
  );
}
