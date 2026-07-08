import { Link } from 'react-router-dom';
import { PointsGuideNav } from '../components/PointsGuideNav';
import { SiteFooter } from '../components/SiteFooter';
import { TopNavbar } from '../components/TopNavbar';
import { POINTS_GUIDE_DESTINATIONS } from '../data/pointsGuides';

export default function PointsGuidePage() {
  return (
    <div className="app-page faq-shell points-guide-page">
      <TopNavbar />
      <header className="points-guide-hero">
        <div className="points-guide-hero-inner">
          <h1 className="points-guide-hero-title">Points Guide</h1>
          <p className="points-guide-hero-lede">
            Curated destination guides for award travelers — where to transfer, what to expect,
            and how to search live space on FlightHero.
          </p>
        </div>
      </header>

      <main className="points-guide-main">
        <div className="points-guide-layout">
          <PointsGuideNav guides={POINTS_GUIDE_DESTINATIONS} mode="scroll" />

          <div className="points-guide-list">
            {POINTS_GUIDE_DESTINATIONS.map((guide) => (
              <Link
                key={guide.id}
                id={guide.id}
                to={`/points-guide/${guide.id}`}
                className="points-guide-teaser"
              >
                <div className="points-guide-teaser-media">
                  <img
                    className="points-guide-teaser-image"
                    src={guide.image}
                    alt={guide.imageAlt}
                    loading="lazy"
                  />
                </div>
                <div className="points-guide-teaser-body">
                  <p className="points-guide-card-region">{guide.region}</p>
                  <h2 className="points-guide-teaser-title">{guide.title}</h2>
                  <p className="points-guide-teaser-lede">{guide.lede}</p>
                </div>
                <span className="points-guide-teaser-action" aria-hidden="true">
                  Read guide →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
