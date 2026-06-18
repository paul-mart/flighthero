export const FLIGHTHERO_LOGO = '/flighthero-logo.png?v=7';
export const FLIGHTHERO_FOOTER_LOGO = '/flighthero-logo-footer.png?v=4';

export function FlightHeroLogo({ variant = 'hero' }: { variant?: 'hero' | 'nav' | 'footer' }) {
  const src = variant === 'footer' ? FLIGHTHERO_FOOTER_LOGO : FLIGHTHERO_LOGO;

  return (
    <img
      src={src}
      alt="FlightHero"
      className={`flighthero-logo flighthero-logo--${variant}`}
      decoding="async"
    />
  );
}
