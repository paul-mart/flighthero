import { TopNavbar } from '../components/TopNavbar';
import { SiteFooter } from '../components/SiteFooter';

export default function LegalPage() {
  return (
    <div className="app-page faq-shell">
      <TopNavbar />
      <main className="faq-main">
        <header className="faq-header">
          <h1 className="faq-title">Legal</h1>
        </header>

        <article className="faq-article">
          <h2 className="faq-article-title">Intellectual Property Notice &amp; Third-Party Trademarks</h2>
          <p>
            FlightHero displays information regarding various loyalty programs, credit card points
            systems, and travel providers. All third-party trademarks (including logos, brand names,
            and icons) referenced on this platform remain the property of their respective owners.
          </p>
          <p>
            FlightHero&apos;s use of these trademarks is solely for nominative, descriptive, and
            informational purposes to help users identify respective point currencies and transfer
            partners. Such use does not constitute or imply an endorsement, partnership, sponsorship,
            or recommendation between FlightHero and the trademark owners.
          </p>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
