import { DealsCarousel } from '../components/DealsCarousel';
import { DealsHeroGraphic } from '../components/DealsHeroGraphic';
import { SiteFooter } from '../components/SiteFooter';
import { TopNavbar } from '../components/TopNavbar';
import { REGIONAL_DEAL_SECTIONS } from '../data/regionalDeals';
import type { TrendingDeal } from '../data/trendingDeals';
import { openFlightSearchInNewTab } from '../lib/searchUrl';

function handleDealSelect(deal: TrendingDeal) {
  openFlightSearchInNewTab({
    origin: deal.origin,
    destination: deal.destination,
    departureDate: deal.departureDate,
    returnDate: deal.returnDate,
    tripType: deal.tripType,
    searchType: deal.searchType,
    cabinClass: deal.cabinClass,
    adults: 1,
    childrenCount: 0,
  });
}

export default function DealsPage() {
  return (
    <div className="app-page faq-shell deals-page">
      <TopNavbar />
      <header className="deals-hero-banner">
        <div className="deals-hero-banner-inner">
          <div className="deals-hero-banner-copy">
            <h1 className="deals-hero-banner-title">Deals</h1>
            <p className="deals-hero-banner-lede">
              Curated award routes by region — click any deal to search live availability and fares.
            </p>
          </div>
          <div className="deals-hero-banner-graphic">
            <DealsHeroGraphic />
          </div>
        </div>
      </header>
      <main className="faq-main deals-page-main">
        {REGIONAL_DEAL_SECTIONS.map((section) => (
          <section
            key={section.id}
            className="deals-region-section trending-deals"
            aria-labelledby={`deals-region-${section.id}`}
          >
            <div className="trending-deals-inner">
              <DealsCarousel
                slides={section.slides}
                onSelectDeal={handleDealSelect}
                titleId={`deals-region-${section.id}`}
                title={section.title}
                subtitle={section.description}
                navPlacement="header"
              />
            </div>
          </section>
        ))}
      </main>
      <SiteFooter />
    </div>
  );
}
