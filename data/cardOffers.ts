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
      'Chase and Marriott are offering one of the richer Boundless welcome packages we have tracked: 125,000 Bonvoy points plus a Free Night Award valued up to 50,000 points after $3,000 in eligible purchases during the first three months. New cardmembers can also earn up to $100 in airline statement credits as part of the same limited-time offer.',
      'Taken together, the signup bonus is effectively 125,000 points plus a certificate worth up to 50,000 points at redemption — before counting ongoing earn. That is a strong package for travelers who stay at Marriott brands and want a low annual-fee hotel card in their wallet.',
      'Day-to-day, Boundless earns up to 17X total points per dollar at hotels participating in Marriott Bonvoy, 3X on the first $6,000 in combined annual spend at gas stations, grocery stores, and dining, 2X on other travel, and 2X on everything else. Cardmembers receive automatic Silver Elite status, 15 Elite Night Credits each calendar year, and an annual Free Night Award worth up to 35,000 points after each account anniversary.',
      'For award-minded travelers, Bonvoy free nights and point stays can complement airline redemptions — use points for the hotel portion of a trip after you book flights on FlightHero. Spending $35,000 on the card in a calendar year also unlocks Gold Elite status, which can meaningfully improve on-property benefits.',
      'Chase’s 5/24 rule and Marriott’s standard new-cardmember bonus restrictions still apply, and you may not qualify if you have held this card recently. Confirm the live offer, airline credit terms, and Free Night Award rules on the application page before you apply.',
    ],
    highlights: [
      '125,000 points + free night (up to 50k) after $3,000 spend in 3 months',
      'Up to $100 in airline credits with the current welcome offer',
      '17X at Marriott hotels; annual 35k free night after first year',
      'Silver Elite status and 15 Elite Night Credits each year',
    ],
    caveat: 'Bonvoy points are hotel currency — best if you actually stay at Marriott properties. Only apply if you can pay your balance in full.',
  },
  {
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
      'Capital One is running a limited-time welcome offer on the Savor card: $250 cash back after $500 in purchases during the first three months. That is an unusually low spending threshold for a bonus this size — especially on a card with no annual fee.',
      'Savor is built for everyday “food and fun” spending. Cardholders earn unlimited 3% cash back at grocery stores, restaurants, entertainment venues, and popular streaming services, plus 1% on everything else. Superstore purchases at Walmart and Target do not count toward the grocery rate.',
      'Travelers still get extra earn through Capital One’s portals: 5% cash back on hotels, vacation rentals, rental cars, and activities booked via Capital One Travel, and 8% on eligible tickets purchased through the Capital One Entertainment platform. There are no foreign transaction fees, which helps if you use the card abroad.',
      'This is a cash back product, not a transferable miles card — rewards redeem as statement credits, checks, gift cards, or toward travel and entertainment bookings through Capital One. If your goal is airline partner transfers, pair Savor with a miles-earning Capital One card like Venture and use Savor for dining and entertainment categories instead.',
      'Capital One notes that existing or previous Savor cardholders may not qualify if they received a new-cardmember bonus for this product in the past 48 months. As always, confirm the current offer on the application page before you apply.',
    ],
    highlights: [
      '$250 cash back after $500 spend in 3 months',
      '$0 annual fee and no foreign transaction fees',
      '3% back on groceries, dining, entertainment, and streaming',
      '5% on Capital One Travel; 8% on Capital One Entertainment tickets',
    ],
    caveat: 'Savor earns cash back, not transferable airline miles. Only apply if you can pay your balance in full — interest charges can quickly erase a welcome bonus.',
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
