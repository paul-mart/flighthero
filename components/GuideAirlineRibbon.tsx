import { publicUrl } from '../lib/publicUrl';
import type { GuideAirline } from '../data/pointsGuides';

interface GuideAirlineRibbonProps {
  destination: string;
  airlines: GuideAirline[];
}

export function GuideAirlineRibbon({ destination, airlines }: GuideAirlineRibbonProps) {
  return (
    <div className="guide-airline-ribbon" aria-label={`Best airlines for points redemption to ${destination}`}>
      <p className="guide-airline-ribbon-label">
        Our best airlines for points redemption to {destination}:
      </p>
      <ul className="guide-airline-ribbon-logos">
        {airlines.map((airline) => (
          <li key={airline.label}>
            <div className="guide-airline-logo" title={airline.label}>
              <div
                className={`guide-airline-logo-mark${
                  airline.accentClass ? ` guide-airline-logo-mark--${airline.accentClass}` : ''
                }`}
              >
                {airline.logo ? (
                  <img
                    src={publicUrl(airline.logo)}
                    alt={airline.label}
                    className="guide-airline-logo-img"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className="guide-airline-logo-text" aria-hidden="true">
                    {airline.shortLabel ?? airline.label.slice(0, 3).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="guide-airline-logo-name">{airline.label}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
