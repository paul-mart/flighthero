import { Link } from 'react-router-dom';
import { publicUrl } from '../lib/publicUrl';

const SAMPLE_PROMPTS = [
  'Find BOS to NRT award space',
  'Best way to use Amex points to Europe',
  'How do I transfer Chase points to United?',
] as const;

const QUICK_LINKS = [
  { label: 'Browse Award Sweet Spots', to: '/deals' },
  { label: 'Check Point Transfer Ratios', to: '/points-news#transfer-guide' },
  { label: 'Read the FAQ', to: '/faq' },
] as const;

export function NeedHelpSection() {
  return (
    <section className="home-need-help" aria-labelledby="home-need-help-title">
      <div className="home-need-help-inner">
        <div className="home-need-help-banner">
          <div className="home-need-help-banner-copy">
            <h2 id="home-need-help-title" className="home-need-help-banner-title">
              Need help finding flights? Ask Hero
            </h2>
            <p className="home-need-help-banner-lede">
              Get personalized award routing, sweet spot strategies, or help maximizing your credit
              card points instantly.
            </p>
            <div className="home-need-help-banner-actions">
              <Link to="/ask-hero" className="home-need-help-cta">
                Launch Ask Hero Assistant
              </Link>
              <ul className="home-need-help-prompts" aria-label="Sample questions">
                {SAMPLE_PROMPTS.map((prompt) => (
                  <li key={prompt}>
                    <Link
                      to={`/ask-hero?prompt=${encodeURIComponent(prompt)}`}
                      className="home-need-help-prompt"
                    >
                      {prompt}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="home-need-help-banner-graphic">
            <img
              src={publicUrl('ask-hero/chat-icon.png')}
              alt=""
              className="home-need-help-banner-graphic-img"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        <nav className="home-need-help-utilities" aria-label="Quick guides">
          {QUICK_LINKS.map(({ label, to }, index) => (
            <span key={to} className="home-need-help-util-item">
              {index > 0 ? (
                <span className="home-need-help-util-sep" aria-hidden="true">
                  |
                </span>
              ) : null}
              <Link to={to} className="home-need-help-util-link">
                {label}
              </Link>
            </span>
          ))}
        </nav>
      </div>
    </section>
  );
}
