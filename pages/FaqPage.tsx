import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TopNavbar } from '../components/TopNavbar';
import { SiteFooter } from '../components/SiteFooter';
import { TRANSFER_PARTNER_OPTIONS } from '../lib/cpp';

export default function FaqPage() {
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="app-page faq-shell">
      <TopNavbar />
      <main className="faq-main">
        <header className="faq-header">
          <Link to="/" className="faq-back-link">← Back to search</Link>
          <h1 className="faq-title">FAQ</h1>
        </header>

        <article id="custom-cent-per-point" className="faq-article">
          <h2 className="faq-article-title">Custom cent-per-point</h2>
          <p>
            When you book with points, <strong>redemption value</strong> tells you how many cents
            of flight value you are getting for each point on a specific award. We calculate it by
            comparing the matched cash fare to the points price, after subtracting taxes and fees.
          </p>
          <p>
            <strong>Custom cent-per-point</strong> benchmarks are the personal targets you set for
            each transfer partner in{' '}
            <Link to="/profile">Profile → Preferences</Link>. Grades on award flights compare this
            flight&apos;s redemption value to those benchmarks:
          </p>
          <ul className="faq-list">
            <li><strong>Very good</strong> — 25% or more above your benchmark</li>
            <li><strong>Good</strong> — 5% to 25% above</li>
            <li><strong>OK</strong> — within about 15% below to 5% above</li>
            <li><strong>Bad</strong> — 15% to 35% below</li>
            <li><strong>Very bad</strong> — more than 35% below</li>
          </ul>
          <p>
            If you have not set custom values yet, we use default benchmarks so grades still appear:
          </p>
          <ul className="faq-list">
            {TRANSFER_PARTNER_OPTIONS.map((partner) => (
              <li key={partner.key}>
                {partner.label}: {partner.defaultCpp.toFixed(2)}¢/pt
              </li>
            ))}
          </ul>
          <p>
            Rows marked <span className="faq-inline-default">default</span> in View flight are using
            these defaults, not a value you saved. Set your own in{' '}
            <Link to="/profile">Preferences</Link> to grade redemptions against what matters to you.
          </p>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
