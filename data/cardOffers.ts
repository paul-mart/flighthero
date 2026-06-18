/**
 * Manually maintained card offer articles.
 * Add new entries to CARD_OFFERS when you want to feature an offer.
 */
export interface CardOffer {
  id: string;
  cardName: string;
  issuerPartner: string;
  headline: string;
  publishedDate: string;
  offerHighlight: string;
  spendRequirement: string;
  annualFee: string;
  sourceName: string;
  sourceUrl: string;
  paragraphs: string[];
  highlights: string[];
  caveat?: string;
}

export const CARD_OFFERS: CardOffer[] = [
  {
    id: 'chase-sapphire-preferred-100k-2026',
    cardName: 'Chase Sapphire Preferred',
    issuerPartner: 'Chase Ultimate Rewards',
    headline: 'Chase brings back a 100,000-point welcome bonus',
    publishedDate: '2026-06-15',
    offerHighlight: '100,000 bonus points',
    spendRequirement: '$5,000 in the first 3 months',
    annualFee: '$95',
    sourceName: 'Thrifty Traveler',
    sourceUrl: 'https://thriftytraveler.com/news/credit-card/chase-sapphire-preferred-100k-bonus/',
    paragraphs: [
      'Chase has revived one of the largest welcome offers we have seen on the Sapphire Preferred: 100,000 Ultimate Rewards points after $5,000 in spending during the first three months. That ties the highest public bonus on this card and stands out for a product with a $95 annual fee.',
      'On its own, 100,000 points are worth at least $1,000 when redeemed through Chase Travel at 1 cent per point. Many travelers can do better by transferring to airline and hotel partners — the same programs FlightHero surfaces when you search award flights.',
      'The timing follows a broader refresh of the card. Recent additions include a larger annual hotel credit through Chase Travel, a statement credit toward Global Entry or TSA PreCheck, and extra earn rates on gas, vacation rentals, and select everyday categories. For many people, those credits alone can offset most of the annual fee.',
      'Eligibility is the catch. Chase still enforces the 5/24 rule, and you may not qualify for a new bonus if you have held this card recently. The good news: Chase often shows a pop-up during the application flow telling you whether you are eligible before a hard inquiry is placed. If you already hold the Sapphire Reserve, you may still be able to add the Preferred and earn this bonus — but it is worth checking before you apply.',
    ],
    highlights: [
      '100,000 points after $5,000 spend in 3 months',
      '$95 annual fee with expanded travel and statement credits',
      'Strong fit if you book award flights and transfer to partners',
      'Limited-time offer — terms and availability can change quickly',
    ],
    caveat: 'Only apply if you can pay your balance in full. A welcome bonus is not worth carrying interest on purchases you cannot afford.',
  },
];

export function formatOfferDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
