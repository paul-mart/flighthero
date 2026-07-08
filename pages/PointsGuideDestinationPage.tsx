import { Link, Navigate, useParams } from 'react-router-dom';
import { GuideAirlineRibbon } from '../components/GuideAirlineRibbon';
import { SiteFooter } from '../components/SiteFooter';
import { TopNavbar } from '../components/TopNavbar';
import { getPointsGuideById } from '../data/pointsGuides';

export default function PointsGuideDestinationPage() {
  const { guideId } = useParams<{ guideId: string }>();
  const guide = guideId ? getPointsGuideById(guideId) : undefined;

  if (!guide) {
    return <Navigate to="/points-guide" replace />;
  }

  return (
    <div className="app-page faq-shell points-guide-page points-guide-page--article">
      <TopNavbar />

      <main className="points-guide-article-main">
        <div className="points-guide-article-column">
          <Link to="/points-guide" className="points-guide-back-link">
            ← All guides
          </Link>

          <header className="points-guide-article-header">
            <p className="points-guide-article-region">{guide.region}</p>
            <h1 className="points-guide-article-title">{guide.title}</h1>
            <p className="points-guide-article-lede">{guide.lede}</p>
          </header>

          <div className="points-guide-article-hero-card">
            <div className="points-guide-article-media">
              <img
                className="points-guide-article-image"
                src={guide.image}
                alt={guide.imageAlt}
              />
            </div>
            <GuideAirlineRibbon destination={guide.title} airlines={guide.bestAirlines} />
          </div>

          <article className="points-guide-article-content">
            <section className="points-guide-section">
              <h2 className="points-guide-section-title">Top Programs</h2>
              <p className="points-guide-section-copy">{guide.topPrograms}</p>
            </section>

            <section className="points-guide-section">
              <h2 className="points-guide-section-title">Ultimate Sweet Spots</h2>
              <ul className="points-guide-section-list">
                {guide.sweetSpots.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="points-guide-section">
              <h2 className="points-guide-section-title">The Booking Window Matrix</h2>
              <div className="points-guide-matrix-wrap">
                <table className="points-guide-matrix">
                  <thead>
                    <tr>
                      <th scope="col">Airline Program</th>
                      <th scope="col">Calendar Opens</th>
                      <th scope="col">Strategy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guide.bookingWindowMatrix.map((row) => (
                      <tr key={row.program}>
                        <td>{row.program}</td>
                        <td>{row.calendarOpens}</td>
                        <td>{row.strategy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="points-guide-section">
              <h2 className="points-guide-section-title">Pro Booking Tips</h2>
              <div className="points-guide-tips-box">
                <ul className="points-guide-tips-list">
                  {guide.bookingTips.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>

            <p className="points-guide-sample-routes">
              <span className="points-guide-sample-routes-label">Sample routes</span>
              {guide.sampleRoutes}
            </p>

            <Link to="/" className="points-guide-card-cta">
              Search live awards
            </Link>
          </article>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
