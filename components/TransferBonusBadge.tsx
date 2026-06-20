import { TransferPartnerLogo } from './TransferPartnerLogo';

interface TransferBonusBadgeProps {
  percent: number;
  className?: string;
}

export function TransferBonusBadge({ percent, className = '' }: TransferBonusBadgeProps) {
  return (
    <span
      className={`transfer-bonus-badge ${className}`.trim()}
      aria-label={`${percent} percent transfer bonus`}
    >
      +{percent}%
    </span>
  );
}

interface TransferBonusPartnerChipProps {
  partner: string;
  percent: number;
  logoSize?: number;
}

export function TransferBonusPartnerChip({
  partner,
  percent,
  logoSize = 25,
}: TransferBonusPartnerChipProps) {
  return (
    <span className="transfer-bonus-partner-chip">
      <span className="transfer-bonus-partner-chip-label">Transfer bonus</span>
      <span className="transfer-bonus-partner-chip-box">
        <TransferPartnerLogo partner={partner} size={logoSize} />
        <TransferBonusBadge percent={percent} />
      </span>
    </span>
  );
}

interface TransferBonusMathProps {
  awardPoints: number;
  transferPointsNeeded: number;
  compact?: boolean;
}

export function TransferBonusMath({
  awardPoints,
  transferPointsNeeded,
  compact = false,
}: TransferBonusMathProps) {
  return (
    <span className={`transfer-bonus-math${compact ? ' transfer-bonus-math--compact' : ''}`}>
      <span className="transfer-bonus-math-struck">{awardPoints.toLocaleString()}</span>
      <span className="transfer-bonus-math-effective">
        {transferPointsNeeded.toLocaleString()} pts
      </span>
      <span className="transfer-bonus-math-arrow" aria-hidden>→</span>
      <span className="transfer-bonus-math-award">{awardPoints.toLocaleString()}</span>
    </span>
  );
}
