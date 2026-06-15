export const FLIGHTHERO_LOGO = '/flighthero-logo.png?v=6';

export function FlightHeroLogo({ variant = 'hero' }: { variant?: 'hero' | 'nav' }) {
  return (
    <img
      src={FLIGHTHERO_LOGO}
      alt="FlightHero"
      className={`flighthero-logo flighthero-logo--${variant}`}
      decoding="async"
    />
  );
}
