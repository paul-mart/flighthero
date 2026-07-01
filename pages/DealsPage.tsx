import { DealsCarousel } from '../components/DealsCarousel';
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
    <div className="app-page faq-shell">
      <TopNavbar />
      <main className="faq-main deals-page-main">
        <header className="faq-header">
          <h1 className="faq-title">Deals</h1>
          <p className="deals-page-lede">
            Curated award routes by region — click any deal to search live availability and fares.
          </p>
        </header>

        {REGIONAL_DEAL_SECTIONS.map((section) => (
          <section
            key={section.id}
            className="deals-region-section trending-deals trending-deals--visible"
            aria-labelledby={`deals-region-${section.id}`}
          >
            <div className="trending-deals-inner">
              <div className="trending-deals-header">
                <h2 id={`deals-region-${section.id}`} className="trending-deals-title">
                  {section.title}
                </h2>
                <p className="trending-deals-subtitle">{section.description}</p>
              </div>

              <DealsCarousel
                slides={section.slides}
                onSelectDeal={handleDealSelect}
                titleId={`deals-region-${section.id}`}
              />
            </div>
          </section>
        ))}
      </main>
      <SiteFooter />
    </div>
  );
}
