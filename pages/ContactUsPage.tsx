import { Link } from 'react-router-dom';
import { TopNavbar } from '../components/TopNavbar';
import { SiteFooter } from '../components/SiteFooter';

export default function ContactUsPage() {
  return (
    <div className="app-page faq-shell">
      <TopNavbar />
      <main className="faq-main">
        <header className="faq-header">
          <Link to="/" className="faq-back-link">← Back to search</Link>
          <h1 className="faq-title">Contact Us</h1>
        </header>

        <article className="faq-article">
          <p>
            Have a question, suggestion, or issue with FlightHero? We&apos;d love to hear from you.
          </p>
          <p>
            For help with searches, redemption values, or account settings, check our{' '}
            <Link to="/faq">FAQ</Link> first — it covers the most common topics.
          </p>
          <p>
            For anything else,{' '}
            <a href="mailto:?subject=FlightHero%20Support%20Request">send us an email</a>.
          </p>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
