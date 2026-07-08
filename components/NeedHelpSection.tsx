import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { extractAirportCode } from '../lib/airportCode';
import { publicUrl } from '../lib/publicUrl';

const STATIC_SAMPLE_PROMPTS = [
  'Best way to use Amex points to Europe',
  'How do I transfer Chase points to United?',
] as const;

const DEFAULT_ORIGIN = 'BOS';

function resolveHomeAirportCode(homeAirport: string, homeAirportLabel: string): string {
  if (homeAirport.trim()) return homeAirport.trim().toUpperCase();
  const fromLabel = extractAirportCode(homeAirportLabel);
  if (fromLabel) return fromLabel;
  return DEFAULT_ORIGIN;
}

function buildTokyoSamplePrompt(originCode: string): string {
  return `Find ${originCode} to TYO award space`;
}

const QUICK_LINKS = [
  { label: 'Browse Award Sweet Spots', to: '/deals' },
  { label: 'Check Point Transfer Ratios', to: '/points-news#transfer-bonuses' },
  { label: 'Read the FAQ', to: '/faq' },
] as const;

export function NeedHelpSection() {
  const { profile } = useAuth();
  const homeAirport = profile?.preferences?.homeAirport ?? '';
  const homeAirportLabel = profile?.preferences?.homeAirportLabel ?? '';

  const samplePrompts = useMemo(() => {
    const origin = resolveHomeAirportCode(homeAirport, homeAirportLabel);
    return [buildTokyoSamplePrompt(origin), ...STATIC_SAMPLE_PROMPTS];
  }, [homeAirport, homeAirportLabel]);

  return (
    <section className="home-need-help" aria-labelledby="home-need-help-title">
      <div className="home-need-help-inner">
        <div className="home-need-help-banner">
          <div className="home-need-help-banner-copy">
            <h2 id="home-need-help-title" className="home-need-help-banner-title">
              Need help finding flights? Ask Hero
            </h2>
            <p className="home-need-help-banner-lede">
              Meet FlightHero&apos;s AI assistant, Ask Hero. Built to help you navigate transfer
              partners, map out complex point routes, and book award travel faster.
            </p>
            <Link to="/ask-hero" className="home-need-help-cta">
              Launch Ask Hero
            </Link>
          </div>

          <ul className="home-need-help-prompts" aria-label="Sample questions">
            {samplePrompts.map((prompt) => (
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
