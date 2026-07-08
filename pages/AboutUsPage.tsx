import { Link } from 'react-router-dom';
import { AboutFeatureGraphic } from '../components/AboutFeatureGraphic';
import { AboutHeroGraphic } from '../components/AboutHeroGraphic';
import { SiteFooter } from '../components/SiteFooter';
import { TopNavbar } from '../components/TopNavbar';

const FEATURES = [
  {
    variant: 'compare' as const,
    title: 'Cash and points, side by side',
    copy:
      'Search a route once and compare live cash fares with award availability on the same screen, including cents-per-point grades when we can match an award to a comparable fare.',
  },
  {
    variant: 'transfer' as const,
    title: 'The full transfer path',
    copy:
      'See which bank points can book each award option, so you know exactly how to move from your credit card balance to a confirmed seat.',
  },
  {
    variant: 'alerts' as const,
    title: 'Track routes that matter',
    copy:
      'Save routes and get notified when prices drop or award space opens, so you do not have to refresh searches every day.',
  },
  {
    variant: 'guide' as const,
    title: 'Guidance when you need it',
    copy:
      'Browse curated deals, transfer bonus news, and Ask Hero for help planning redemptions, all built for people learning points travel.',
  },
];

const DIFFERENTIATORS = [
  {
    title: 'Built for the full journey',
    copy:
      'Many tools stop at showing award space or cash prices. FlightHero connects the dots from search to transfer partners to booking readiness, all in one place.',
  },
  {
    title: 'Value you can actually judge',
    copy:
      'We grade redemptions with cents-per-point context so you can tell whether an award is a great deal or better paid in cash, without doing the math yourself.',
  },
  {
    title: 'Made by a traveler, for travelers',
    copy:
      'FlightHero is an independent project focused on helping more people experience travel through points, not a bank portal or affiliate funnel dressed up as search.',
  },
  {
    title: 'Always improving',
    copy:
      'New programs, transfer bonuses, and deal routes are added regularly. The goal is a tool that keeps up with how fast the points world changes.',
  },
];

export default function AboutUsPage() {
  return (
    <div className="app-page faq-shell about-page">
      <TopNavbar />
      <header className="about-hero-banner">
        <div className="about-hero-banner-inner">
          <div className="about-hero-banner-copy">
            <h1 className="about-hero-banner-title">About FlightHero</h1>
            <p className="about-hero-banner-lede">
              We help you compare cash and award flights, understand transfer options, and book
              smarter so your points take you further.
            </p>
          </div>
          <div className="about-hero-banner-graphic">
            <AboutHeroGraphic />
          </div>
        </div>
      </header>

      <main className="about-main">
        <section className="about-section" aria-labelledby="about-mission-title">
          <div className="about-section-inner">
            <h2 id="about-mission-title" className="about-section-title">
              What FlightHero does
            </h2>
            <p className="about-section-lede">
              FlightHero is a points-and-cash flight search tool for people who want to travel
              more without guessing whether an award is worth it. We aggregate award availability
              across mileage programs, show live cash fares on the same routes, and surface the
              transfer partners that can book each option.
            </p>
            <p className="about-section-lede">
              Whether you are booking your first award flight or optimizing a multi-leg trip, the
              goal is the same: make it easier to see your options clearly and act on them with
              confidence.
            </p>
          </div>
        </section>

        <section className="about-section about-features" aria-labelledby="about-features-title">
          <div className="about-section-inner">
            <h2 id="about-features-title" className="about-section-title">
              How we help you fly smarter
            </h2>
            <div className="about-features-grid">
              {FEATURES.map(({ variant, title, copy }) => (
                <article key={title} className="about-feature-card">
                  <div className="about-feature-graphic" aria-hidden>
                    <AboutFeatureGraphic variant={variant} />
                  </div>
                  <h3 className="about-feature-title">{title}</h3>
                  <p className="about-feature-copy">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="about-section about-differentiators" aria-labelledby="about-diff-title">
          <div className="about-section-inner">
            <h2 id="about-diff-title" className="about-section-title">
              What makes us different
            </h2>
            <p className="about-section-lede">
              There are plenty of flight search and award tools out there. FlightHero is designed
              around a few ideas that set it apart.
            </p>
            <div className="about-diff-grid">
              {DIFFERENTIATORS.map(({ title, copy }) => (
                <article key={title} className="about-diff-card">
                  <h3 className="about-diff-title">{title}</h3>
                  <p className="about-diff-copy">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="about-creator" aria-labelledby="about-creator-title">
          <div className="about-creator-inner">
            <div className="about-creator-badge" aria-hidden>
              <span className="about-creator-initials">PM</span>
            </div>
            <div className="about-creator-copy">
              <h2 id="about-creator-title" className="about-creator-title">
                Hi, I&apos;m Paul Martin
              </h2>
              <p className="about-creator-subtitle">Creator of FlightHero</p>
              <div className="about-creator-body">
                <p>
                  I built FlightHero out of a genuine passion for travel and points. I was not
                  always a big traveler, but a trip to Puerto Rico in January 2025 changed that.
                  I fell in love with the island, the food, the people, literally everything.
                  Most importantly, I fell in love with the idea of travel and experiencing this
                  feeling again.
                </p>
                <p>
                  That trip opened the door to points travel, and I was hooked immediately.
                  Discovering all the places I could reach just from everyday spending and sign-up
                  bonuses sounded too good to be true, but after flying to new countries and
                  booking multiple award flights, I can tell you it is not.
                </p>
                <p>
                  I created FlightHero to help others experience the same excitement that points
                  travel brings me. If you have questions or feedback,{' '}
                  <Link to="/contact">reach out anytime</Link>.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
