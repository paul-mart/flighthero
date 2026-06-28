import { partnerLabelToKey } from '../lib/cpp';
import { publicUrl } from '../lib/publicUrl';

const PARTNER_LOGOS: Record<string, string> = {
  amex: 'partners/amex.png',
  chase: 'partners/chase.png',
  citi: 'partners/citi.png',
  capital_one: 'partners/capital-one.png',
  bilt: 'partners/bilt.png',
  wells_fargo: 'partners/wells-fargo.png',
};

/** Wide wordmarks need tighter caps so they don't dwarf icon-style logos. */
const PARTNER_LOGO_SIZING: Record<string, { heightScale: number; maxWidthScale: number }> = {
  bilt: { heightScale: 0.7, maxWidthScale: 2.6 },
};

function partnerInitials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function TransferPartnerLogo({
  partner,
  size = 36,
  className = '',
}: {
  partner: string;
  size?: number;
  className?: string;
}) {
  const partnerKey = partnerLabelToKey(partner);
  const logoSrc = partnerKey ? publicUrl(PARTNER_LOGOS[partnerKey]) : null;
  const sizing = partnerKey ? PARTNER_LOGO_SIZING[partnerKey] : undefined;
  const logoHeight = Math.round(size * (sizing?.heightScale ?? 1));
  const logoMaxWidth = Math.round(size * (sizing?.maxWidthScale ?? 5.5));

  if (logoSrc) {
    return (
      <img
        src={logoSrc}
        alt={partner}
        className={`transfer-partner-logo${partnerKey === 'bilt' ? ' transfer-partner-logo--bilt' : ''} ${className}`.trim()}
        style={{ height: logoHeight, maxWidth: logoMaxWidth }}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <span
      className={`transfer-partner-logo transfer-partner-logo--fallback ${className}`.trim()}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.34)) }}
      aria-hidden="true"
    >
      {partnerInitials(partner)}
    </span>
  );
}
