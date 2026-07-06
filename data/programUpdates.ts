export interface ProgramUpdate {
  id: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  publishedDate: string;
}

export const PROGRAM_UPDATES: ProgramUpdate[] = [
  {
    id: 'amex-july-virgin-hilton',
    title: 'Amex brings back 30% Virgin Atlantic and 20% Hilton transfer bonuses for July',
    sourceName: 'Frequent Miler',
    sourceUrl: 'https://frequentmiler.com/30-percent-transfer-bonus-american-express-membership-rewards-virgin-atlantic/',
    publishedDate: '2026-07-01',
  },
  {
    id: 'capital-one-eva-july',
    title: 'Capital One offers 30% bonus to EVA Air through July 31',
    sourceName: 'Frequent Miler',
    sourceUrl: 'https://frequentmiler.com/30-transfer-bonus-capital-one-miles-eva-air/',
    publishedDate: '2026-07-01',
  },
  {
    id: 'rove-frontier-partner',
    title: 'Rove adds Frontier as a transfer partner with a 25% launch bonus',
    sourceName: 'Frequent Miler',
    sourceUrl: 'https://frequentmiler.com/frontier-added-as-a-rove-transfer-partner-get-25-transfer-bonus-through-7-31-26/',
    publishedDate: '2026-07-01',
  },
  {
    id: 'citi-accor-50',
    title: 'Citi ThankYou 50% transfer bonus to ALL Accor extended into mid-July',
    sourceName: 'Frequent Miler',
    sourceUrl: 'https://frequentmiler.com/50-percent-transfer-bonus-citi-thankyou-accor-all/',
    publishedDate: '2026-06-14',
  },
];
