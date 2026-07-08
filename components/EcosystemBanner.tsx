import {
  ECOSYSTEM_AIRLINE_PARTNERS,
  ECOSYSTEM_BANK_PARTNERS,
} from '../data/ecosystemPartners';
import { publicUrl } from '../lib/publicUrl';

function EcosystemLogo({
  label,
  logo,
  boxClass,
}: {
  label: string;
  logo: string;
  boxClass?: string;
}) {
  return (
    <div className={`home-ecosystem-logo-box${boxClass ? ` ${boxClass}` : ''}`}>
      <img
        src={publicUrl(logo)}
        alt={label}
        className="home-ecosystem-logo-img"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

export function EcosystemBanner({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  return (
    <section className="home-ecosystem-banner" aria-labelledby="home-ecosystem-title">
      <div className="home-ecosystem-banner-inner">
        <p id="home-ecosystem-title" className="home-ecosystem-title">
          {isAuthenticated
            ? 'Direct transfer partners & ratios'
            : 'Supporting seamless search across global programs'}
        </p>
        <div className="home-ecosystem-grid">
          <ul className="home-ecosystem-row home-ecosystem-row--banks" aria-label="Bank and points programs">
            {ECOSYSTEM_BANK_PARTNERS.map(({ label, logo }) => (
              <li key={label} className="home-ecosystem-item">
                <EcosystemLogo label={label} logo={logo} />
              </li>
            ))}
          </ul>
          <ul className="home-ecosystem-row home-ecosystem-row--airlines" aria-label="Airline partners">
            {ECOSYSTEM_AIRLINE_PARTNERS.map(({ label, logo, ...partner }) => (
              <li key={label} className="home-ecosystem-item">
                <EcosystemLogo
                  label={label}
                  logo={logo}
                  boxClass={'boxClass' in partner ? partner.boxClass : undefined}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
