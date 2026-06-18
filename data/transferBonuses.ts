/**
 * Manually maintained transfer bonus list.
 * Source snapshot: https://frequentmiler.com/current-point-transfer-bonuses/
 * Last synced: June 2, 2026
 *
 * To update: edit ACTIVE_TRANSFER_BONUSES below (current/upcoming only).
 */
export interface TransferBonus {
  transferFrom: string;
  transferTo: string;
  bonusPercent: number;
  summary: string;
  detailsUrl?: string;
  startDate: string;
  endDate: string;
}

export const TRANSFER_BONUS_SOURCE = {
  name: 'Frequent Miler',
  url: 'https://frequentmiler.com/current-point-transfer-bonuses/',
  lastUpdated: '2026-06-02',
} as const;

export const ACTIVE_TRANSFER_BONUSES: TransferBonus[] = [
  {
    transferFrom: 'Chase Ultimate Rewards',
    transferTo: 'Marriott Bonvoy',
    bonusPercent: 55,
    summary: '55% transfer bonus to Marriott Bonvoy',
    detailsUrl: 'https://frequentmiler.com/chase-ultimate-rewards-offering-65-transfer-bonus-to-marriott/',
    startDate: '2026-05-16',
    endDate: '2026-06-30',
  },
  {
    transferFrom: 'Amex Membership Rewards',
    transferTo: 'Marriott Bonvoy',
    bonusPercent: 20,
    summary: '20% transfer bonus to Marriott Bonvoy',
    detailsUrl: 'https://frequentmiler.com/20-transfer-bonus-to-marriott-bonvoy-from-american-express-membership-rewards/',
    startDate: '2026-06-01',
    endDate: '2026-06-30',
  },
  {
    transferFrom: 'Rove Miles',
    transferTo: 'Turkish Airlines Miles & Smiles',
    bonusPercent: 50,
    summary: '50% transfer bonus to Turkish Miles & Smiles',
    detailsUrl: 'https://frequentmiler.com/50-transfer-bonus-to-turkish-miles-smiles-from-rove-miles/',
    startDate: '2026-06-01',
    endDate: '2026-06-30',
  },
  {
    transferFrom: 'Citi ThankYou Rewards',
    transferTo: 'Qatar Privilege Club Avios',
    bonusPercent: 30,
    summary: '30% transfer bonus to Qatar Privilege Club Avios',
    detailsUrl: 'https://frequentmiler.com/30-transfer-bonus-to-qatar-avios-from-citi-thankyou/',
    startDate: '2026-06-01',
    endDate: '2026-06-30',
  },
  {
    transferFrom: 'Amex Membership Rewards',
    transferTo: 'Air France KLM Flying Blue',
    bonusPercent: 25,
    summary: '25% transfer bonus to Air France KLM Flying Blue',
    detailsUrl: 'https://frequentmiler.com/get-a-25-bonus-when-transferring-amex-membership-rewards-to-air-france-klm-flying-blue/',
    startDate: '2026-06-02',
    endDate: '2026-06-30',
  },
  {
    transferFrom: 'Marriott Bonvoy',
    transferTo: 'United MileagePlus',
    bonusPercent: 25,
    summary: '25% transfer bonus to United MileagePlus',
    detailsUrl: 'https://frequentmiler.com/get-a-25-bonus-when-converting-hotel-points-to-united/',
    startDate: '2026-06-01',
    endDate: '2026-06-30',
  },
  {
    transferFrom: 'Chase Ultimate Rewards',
    transferTo: 'Virgin Atlantic Flying Club',
    bonusPercent: 30,
    summary: '30% transfer bonus to Virgin Atlantic Flying Club',
    detailsUrl: 'https://frequentmiler.com/chase-ultimate-rewards-virgin-atlantic-30-percent-transfer-bonus/',
    startDate: '2026-06-09',
    endDate: '2026-07-14',
  },
  {
    transferFrom: 'Amex Membership Rewards',
    transferTo: 'Avianca LifeMiles',
    bonusPercent: 15,
    summary: '15% transfer bonus to Avianca LifeMiles',
    detailsUrl: 'https://frequentmiler.com/15-transfer-bonus-from-amex-membership-rewards-to-avianca-lifemiles/',
    startDate: '2026-06-15',
    endDate: '2026-07-15',
  },
  {
    transferFrom: 'Citi ThankYou Rewards',
    transferTo: 'ALL Accor',
    bonusPercent: 50,
    summary: '50% transfer bonus to ALL Accor',
    detailsUrl: 'https://frequentmiler.com/50-percent-transfer-bonus-citi-thankyou-accor-all/',
    startDate: '2026-06-14',
    endDate: '2026-07-18',
  },
];

const FLIGHTHERO_PROGRAMS = new Set([
  'Amex Membership Rewards',
  'Chase Ultimate Rewards',
  'Citi ThankYou Rewards',
  'Capital One Miles',
  'Bilt Rewards',
]);

export function isFlightHeroTransferProgram(transferFrom: string): boolean {
  return FLIGHTHERO_PROGRAMS.has(transferFrom);
}

export function formatBonusDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function transferFromToLogoPartner(transferFrom: string): string | null {
  const lower = transferFrom.toLowerCase();
  if (lower.includes('amex')) return 'Amex Membership Rewards';
  if (lower.includes('chase')) return 'Chase Ultimate Rewards';
  if (lower.includes('citi')) return 'Citi ThankYou';
  if (lower.includes('capital one')) return 'Capital One';
  if (lower.includes('bilt')) return 'Bilt Rewards';
  return null;
}
