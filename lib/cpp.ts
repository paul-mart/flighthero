export type RedemptionGrade = 'very-good' | 'good' | 'ok' | 'bad' | 'very-bad';

/** CPP = cents per point — how many cents of flight value each point is worth. */

export interface TransferPartnerOption {
  key: string;
  label: string;
  defaultCpp: number;
}

export const TRANSFER_PARTNER_OPTIONS: TransferPartnerOption[] = [
  { key: 'amex', label: 'Amex Membership Rewards', defaultCpp: 1.7 },
  { key: 'chase', label: 'Chase Ultimate Rewards', defaultCpp: 1.5 },
  { key: 'citi', label: 'Citi ThankYou', defaultCpp: 1.5 },
  { key: 'capital_one', label: 'Capital One', defaultCpp: 1.5 },
  { key: 'bilt', label: 'Bilt Rewards', defaultCpp: 1.5 },
];

export const GRADE_LABELS: Record<RedemptionGrade, string> = {
  'very-good': 'Very good',
  good: 'Good',
  ok: 'OK',
  bad: 'Bad',
  'very-bad': 'Very bad',
};

export type CppValuations = Record<string, number>;

export function partnerLabelToKey(label: string): string | null {
  const lower = label.toLowerCase();
  if (lower.includes('amex')) return 'amex';
  if (lower.includes('chase')) return 'chase';
  if (lower.includes('citi')) return 'citi';
  if (lower.includes('capital one')) return 'capital_one';
  if (lower.includes('bilt')) return 'bilt';
  if (lower.includes('wells fargo')) return 'wells_fargo';
  return null;
}

export function getBenchmarkCpp(
  partnerKey: string | null,
  valuations?: CppValuations,
): number | null {
  if (!partnerKey) return null;
  const custom = valuations?.[partnerKey];
  if (typeof custom === 'number' && custom > 0) {
    return custom;
  }
  const option = TRANSFER_PARTNER_OPTIONS.find((item) => item.key === partnerKey);
  return option?.defaultCpp ?? null;
}

export function hasCustomCppValuation(
  partnerKey: string | null,
  valuations?: CppValuations,
): boolean {
  if (!partnerKey) return false;
  const custom = valuations?.[partnerKey];
  return typeof custom === 'number' && custom > 0;
}

export function calculateCpp(
  cashPrice: number,
  pointsRequired: number,
  taxesAndFees: number,
): number | null {
  if (cashPrice <= 0 || pointsRequired <= 0) return null;
  const netValue = cashPrice - taxesAndFees;
  if (netValue <= 0) return null;
  return (netValue / pointsRequired) * 100;
}

export function gradeRedemption(actualCpp: number, benchmarkCpp: number): RedemptionGrade {
  if (benchmarkCpp <= 0) return 'ok';
  const ratio = actualCpp / benchmarkCpp;
  if (ratio >= 1.25) return 'very-good';
  if (ratio >= 1.05) return 'good';
  if (ratio >= 0.85) return 'ok';
  if (ratio >= 0.65) return 'bad';
  return 'very-bad';
}

export function formatCpp(cpp: number): string {
  return `${cpp.toFixed(2)}¢`;
}

export interface PartnerRedemptionRating {
  partner: string;
  partnerKey: string | null;
  benchmarkCpp: number | null;
  grade: RedemptionGrade | null;
}

export function rateTransferPartners(
  partners: string[],
  actualCpp: number | null,
  valuations?: CppValuations,
): PartnerRedemptionRating[] {
  return partners.map((partner) => {
    const partnerKey = partnerLabelToKey(partner);
    const benchmarkCpp = getBenchmarkCpp(partnerKey, valuations);
    const grade = actualCpp != null && benchmarkCpp != null
      ? gradeRedemption(actualCpp, benchmarkCpp)
      : null;
    return { partner, partnerKey, benchmarkCpp, grade };
  });
}
