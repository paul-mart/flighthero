/**
 * Manually maintained transfer bonus list.
 * Source snapshot: https://frequentmiler.com/current-point-transfer-bonuses/
 * Last synced: July 17, 2026
 *
 * To update: edit ACTIVE_TRANSFER_BONUSES below (current/upcoming only).
 */
import { partnerLabelToKey } from '../lib/cpp';

export interface TransferRatio {
  fromPoints: number;
  toPoints: number;
}

export interface TransferBonus {
  transferFrom: string;
  transferTo: string;
  bonusPercent: number;
  summary: string;
  baseTransferRatio: TransferRatio;
  detailsUrl?: string;
  startDate: string;
  endDate: string;
}

export const TRANSFER_BONUS_SOURCE = {
  name: 'Frequent Miler',
  url: 'https://frequentmiler.com/current-point-transfer-bonuses/',
  lastUpdated: '2026-07-17',
} as const;

export const ACTIVE_TRANSFER_BONUSES: TransferBonus[] = [
  {
    transferFrom: 'Citi ThankYou Rewards',
    transferTo: 'ALL Accor',
    bonusPercent: 50,
    summary: '50% transfer bonus to ALL Accor',
    baseTransferRatio: { fromPoints: 1_000, toPoints: 1_000 },
    detailsUrl: 'https://frequentmiler.com/50-percent-transfer-bonus-citi-thankyou-accor-all/',
    startDate: '2026-06-14',
    endDate: '2026-07-18',
  },
  {
    transferFrom: 'Chase Ultimate Rewards',
    transferTo: 'IHG One Rewards',
    bonusPercent: 100,
    summary: '100% transfer bonus to IHG One Rewards',
    baseTransferRatio: { fromPoints: 1_000, toPoints: 1_000 },
    detailsUrl: 'https://frequentmiler.com/chase-is-offering-a-70-100-transfer-bonus-to-ihg-one-rewards-give-it-a-miss/',
    startDate: '2026-07-15',
    endDate: '2026-07-30',
  },
  {
    transferFrom: 'Rove Miles',
    transferTo: 'Frontier Miles',
    bonusPercent: 25,
    summary: '25% transfer bonus to Frontier Miles',
    baseTransferRatio: { fromPoints: 1_000, toPoints: 1_000 },
    detailsUrl: 'https://frequentmiler.com/frontier-added-as-a-rove-transfer-partner-get-25-transfer-bonus-through-7-31-26/',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
  },
  {
    transferFrom: 'Capital One Miles',
    transferTo: 'EVA Air Infinity MileageLands',
    bonusPercent: 30,
    summary: '30% transfer bonus to EVA Air Infinity MileageLands',
    baseTransferRatio: { fromPoints: 1_000, toPoints: 750 },
    detailsUrl: 'https://frequentmiler.com/30-transfer-bonus-capital-one-miles-eva-air/',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
  },
  {
    transferFrom: 'Amex Membership Rewards',
    transferTo: 'Virgin Atlantic Flying Club',
    bonusPercent: 30,
    summary: '30% transfer bonus to Virgin Atlantic Flying Club',
    baseTransferRatio: { fromPoints: 1_000, toPoints: 1_000 },
    detailsUrl: 'https://frequentmiler.com/30-percent-transfer-bonus-american-express-membership-rewards-virgin-atlantic/',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
  },
  {
    transferFrom: 'Rove Miles',
    transferTo: 'Qantas Frequent Flyer',
    bonusPercent: 50,
    summary: '50% transfer bonus to Qantas Frequent Flyer',
    baseTransferRatio: { fromPoints: 1_000, toPoints: 1_000 },
    detailsUrl: 'https://frequentmiler.com/rove-adds-qantas-as-transfer-partner-launches-with-50-transfer-bonus/',
    startDate: '2026-07-15',
    endDate: '2026-08-14',
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

export function calculateBonusTransferRatio(
  baseRatio: TransferRatio,
  bonusPercent: number,
): { base: TransferRatio; withBonus: TransferRatio } {
  const bonusToPoints = Math.round(baseRatio.toPoints * (1 + bonusPercent / 100));
  return {
    base: baseRatio,
    withBonus: { fromPoints: baseRatio.fromPoints, toPoints: bonusToPoints },
  };
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

export interface ApplicableTransferBonus {
  partner: string;
  bonus: TransferBonus;
  awardPoints: number;
  transferPointsNeeded: number;
}

function normalizeProgramName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function programNamesMatch(a: string, b: string): boolean {
  const left = normalizeProgramName(a);
  const right = normalizeProgramName(b);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.includes(right) || right.includes(left)) return true;

  const leftTokens = left.split(' ').filter((token) => token.length > 2);
  const rightTokens = right.split(' ').filter((token) => token.length > 2);
  const [shorter, longer] = leftTokens.length <= rightTokens.length
    ? [leftTokens, rightTokens]
    : [rightTokens, leftTokens];
  if (shorter.length === 0) return false;

  return shorter.every((token) =>
    longer.some((candidate) => candidate.includes(token) || token.includes(candidate)),
  );
}

function transferFromMatches(bonusFrom: string, partnerLabel: string): boolean {
  const mappedPartner = transferFromToLogoPartner(bonusFrom);
  if (mappedPartner) {
    const mappedKey = partnerLabelToKey(mappedPartner);
    const partnerKey = partnerLabelToKey(partnerLabel);
    if (mappedKey && partnerKey) return mappedKey === partnerKey;
  }
  return programNamesMatch(bonusFrom, partnerLabel);
}

export function isTransferBonusActive(
  bonus: TransferBonus,
  todayIso = new Date().toISOString().slice(0, 10),
): boolean {
  return todayIso >= bonus.startDate && todayIso <= bonus.endDate;
}

export function calculateTransferPointsNeeded(
  awardPoints: number,
  bonusPercent: number,
): number {
  if (awardPoints <= 0 || bonusPercent <= 0) return awardPoints;
  return Math.ceil(awardPoints / (1 + bonusPercent / 100));
}

export function getApplicableTransferBonuses(
  transferPartners: string[],
  mileageProgram: string,
  awardPoints: number,
  referenceDate = new Date(),
): ApplicableTransferBonus[] {
  const todayIso = referenceDate.toISOString().slice(0, 10);
  const results: ApplicableTransferBonus[] = [];

  for (const partner of transferPartners) {
    const bonus = ACTIVE_TRANSFER_BONUSES.find((candidate) =>
      isTransferBonusActive(candidate, todayIso)
      && isFlightHeroTransferProgram(candidate.transferFrom)
      && transferFromMatches(candidate.transferFrom, partner)
      && programNamesMatch(candidate.transferTo, mileageProgram),
    );

    if (!bonus) continue;

    results.push({
      partner,
      bonus,
      awardPoints,
      transferPointsNeeded: calculateTransferPointsNeeded(awardPoints, bonus.bonusPercent),
    });
  }

  return results.sort((a, b) => a.transferPointsNeeded - b.transferPointsNeeded);
}

export function getTransferBonusForPartner(
  applicableBonuses: ApplicableTransferBonus[],
  partner: string,
): ApplicableTransferBonus | undefined {
  return applicableBonuses.find((entry) => entry.partner === partner);
}
