import { publicUrl } from '../lib/publicUrl';

export function FlightHeroLogo({ variant = 'hero' }: { variant?: 'hero' | 'nav' | 'footer' }) {
  const src = variant === 'footer'
    ? publicUrl('flighthero-logo-footer.png?v=4')
    : publicUrl('flighthero-logo.png?v=7');

  return (
    <img
      src={src}
      alt="FlightHero"
      className={`flighthero-logo flighthero-logo--${variant}`}
      decoding="async"
    />
  );
}
