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
    id: 'marriott-bonvoy-boundless-125k-2026',
    cardName: 'Marriott Bonvoy Boundless',
    issuerPartner: 'Chase Ultimate Rewards',
    headline: 'Marriott Bonvoy Boundless stacks 125k points, a free night, and airline credits',
    publishedDate: '2026-07-01',
    offerHighlight: '125,000 points + free night (up to 50k) + up to $100 airline credits',
    spendRequirement: '$3,000 in the first 3 months',
    annualFee: '$95',
    sourceName: 'Marriott Bonvoy',
    sourceUrl: 'https://www.marriott.com/credit-cards/chase-credit-cards.mi',
    paragraphs: [
      'Chase and Marriott are running a strong Boundless welcome offer: 125,000 Bonvoy points plus a Free Night Award worth up to 50,000 points after $3,000 in eligible purchases in the first three months. New cardmembers can also pick up up to $100 in airline statement credits with the same limited-time package.',
      'All in, you are looking at 125,000 points plus a certificate worth up to 50,000 points at redemption, not counting what you earn on everyday spend. That is a lot of hotel value for a $95 annual fee if you actually stay at Marriott brands.',
      'Day to day, Boundless earns up to 17X total points per dollar at hotels participating in Marriott Bonvoy, 3X on the first $6,000 in combined annual spend at gas stations, grocery stores, and dining, 2X on other travel, and 2X on everything else. Cardmembers get automatic Silver Elite status, 15 Elite Night Credits each calendar year, and an annual Free Night Award worth up to 35,000 points after each account anniversary.',
      'Bonvoy free nights pair well with airline awards if you book your flights with points and cover the hotel separately. Spend $35,000 on the card in a calendar year and you also unlock Gold Elite status, which can make a real difference at check-in.',
      'Chase’s 5/24 rule and Marriott’s new-cardmember bonus restrictions still apply, and you may not qualify if you have held this card recently. Check the live offer, airline credit terms, and Free Night Award rules on the application page before you apply.',
    ],
    highlights: [
      '125,000 points + free night (up to 50k) after $3,000 spend in 3 months',
      'Up to $100 in airline credits with the current welcome offer',
      '17X at Marriott hotels; annual 35k free night after first year',
      'Silver Elite status and 15 Elite Night Credits each year',
    ],
    caveat: 'Bonvoy points only make sense if you stay at Marriott properties. Pay your balance in full every month.',
  },
  {
    id: 'capital-one-savor-250-2026',
    cardName: 'Capital One Savor',
    issuerPartner: 'Capital One',
    headline: 'Capital One Savor offers a $250 welcome bonus on just $500 spend',
    publishedDate: '2026-06-09',
    offerHighlight: '$250 cash bonus',
    spendRequirement: '$500 in the first 3 months',
    annualFee: '$0',
    sourceName: 'Capital One',
    sourceUrl: 'https://www.capitalone.com/learn-grow/money-management/everything-about-savor/',
    paragraphs: [
      'Capital One has a limited-time Savor welcome offer: $250 cash back after $500 in purchases in the first three months. The spend requirement is low for a bonus this size, and the card has no annual fee.',
      'Savor is aimed at everyday food and entertainment spend. You earn unlimited 3% cash back at grocery stores, restaurants, entertainment venues, and popular streaming services, plus 1% on everything else. Superstore purchases at Walmart and Target do not count toward the grocery rate.',
      'You can also earn 5% cash back on hotels, vacation rentals, rental cars, and activities booked through Capital One Travel, and 8% on eligible tickets purchased through Capital One Entertainment. There are no foreign transaction fees, which helps if you use the card abroad.',
      'This is a cash back card, not a transferable miles product. Rewards come back as statement credits, checks, gift cards, or travel and entertainment bookings through Capital One. If you want airline partner transfers, keep a Venture card for that and use Savor for dining and entertainment.',
      'Capital One says existing or previous Savor cardholders may not qualify if they received a new-cardmember bonus for this product in the past 48 months. Confirm the current offer on the application page before you apply.',
    ],
    highlights: [
      '$250 cash back after $500 spend in 3 months',
      '$0 annual fee and no foreign transaction fees',
      '3% back on groceries, dining, entertainment, and streaming',
      '5% on Capital One Travel; 8% on Capital One Entertainment tickets',
    ],
    caveat: 'Savor earns cash back, not transferable airline miles. Pay your balance in full. Interest will eat a welcome bonus fast.',
  },
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
      'Chase is offering 100,000 Ultimate Rewards points on the Sapphire Preferred after $5,000 in spending in the first three months. That matches the highest public bonus we have seen on this card, which is notable for a product with a $95 annual fee.',
      'Redeemed through Chase Travel at 1 cent per point, 100,000 points are worth at least $1,000. Many people get more value by transferring to airline and hotel partners instead.',
      'The card also picked up a larger annual hotel credit through Chase Travel, a statement credit toward Global Entry or TSA PreCheck, and extra earn on gas, vacation rentals, and a few everyday categories. For some cardholders, those credits alone cover most of the annual fee.',
      'Eligibility is the main wrinkle. Chase still applies the 5/24 rule, and you may not qualify for a new bonus if you have held this card recently. Chase often shows a pop-up during the application flow that tells you whether you are eligible before a hard inquiry hits your credit. If you already have the Sapphire Reserve, you may still be able to add the Preferred and earn this bonus, but verify that before you apply.',
    ],
    highlights: [
      '100,000 points after $5,000 spend in 3 months',
      '$95 annual fee with expanded travel and statement credits',
      'Strong fit if you book award flights and transfer to partners',
      'Limited-time offer; terms and availability can change',
    ],
    caveat: 'Only apply if you can pay your balance in full. A welcome bonus is not worth carrying a balance.',
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
