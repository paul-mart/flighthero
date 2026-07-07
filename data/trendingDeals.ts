import { getDestinationImage } from './destinationImages';
import { formatRecentDate } from '../lib/recentSearches';

export interface TrendingDeal {
  id: string;
  origin: string;
  destination: string;
  city: string;
  country: string;
  routeLabel: string;
  detailLabel: string;
  departureDate: string;
  returnDate: string;
  tripType: 'one-way' | 'round-trip';
  searchType: 'points';
  cabinClass: string;
  pointsLabel: string;
  cashLabel: string;
  program: string;
  image: string;
}

export interface CreateTrendingDealOptions {
  highlightRoundTrip?: boolean;
}

export function createTrendingDeal(
  id: string,
  originCode: string,
  originName: string,
  destCode: string,
  destCity: string,
  country: string,
  departureDate: string,
  returnDate: string,
  pointsLabel: string,
  cashLabel: string,
  program: string,
  options?: CreateTrendingDealOptions,
): TrendingDeal {
  const highlightRoundTrip = options?.highlightRoundTrip ?? false;
  const origin = `${originName} (${originCode})`;
  const destination = `${destCity} (${destCode})`;
  const dateLabel = formatRecentDate({
    origin,
    destination,
    departureDate,
    returnDate,
    tripType: 'round-trip',
    searchType: 'points',
    cabinClass: 'economy',
    adults: 1,
    childrenCount: 0,
    searchedAt: 0,
  });
  return {
    id,
    origin,
    destination,
    city: destCity,
    country,
    routeLabel: highlightRoundTrip
      ? `${originCode} ⇄ ${destCode}`
      : `${originCode} → ${destCode}`,
    detailLabel: highlightRoundTrip ? dateLabel : country,
    departureDate,
    returnDate,
    tripType: 'round-trip',
    searchType: 'points',
    cabinClass: 'economy',
    pointsLabel,
    cashLabel,
    program,
    image: getDestinationImage(destination),
  };
}

/** Three slides of four curated award routes. Fares are typical saver-level starting points. */
export const TRENDING_DEAL_SLIDES: TrendingDeal[][] = [
  [
    createTrendingDeal('bos-lhr', 'BOS', 'Boston', 'LHR', 'London', 'United Kingdom', '2026-09-12', '2026-09-19', 'From 30k pts', 'From $489', 'Aeroplan'),
    createTrendingDeal('jfk-cdg', 'JFK', 'New York', 'CDG', 'Paris', 'France', '2026-10-03', '2026-10-10', 'From 25k pts', 'From $512', 'Flying Blue'),
    createTrendingDeal('bos-dub', 'BOS', 'Boston', 'DUB', 'Dublin', 'Ireland', '2026-08-21', '2026-08-28', 'From 13k pts', 'From $398', 'Aer Lingus Avios'),
    createTrendingDeal('ewr-fco', 'EWR', 'New York', 'FCO', 'Rome', 'Italy', '2026-11-07', '2026-11-14', 'From 33k pts', 'From $548', 'United MileagePlus'),
  ],
  [
    createTrendingDeal('lax-hnd', 'LAX', 'Los Angeles', 'HND', 'Tokyo', 'Japan', '2026-10-18', '2026-10-28', 'From 40k pts', 'From $789', 'ANA via Amex'),
    createTrendingDeal('sfo-icn', 'SFO', 'San Francisco', 'ICN', 'Seoul', 'South Korea', '2026-09-25', '2026-10-05', 'From 35k pts', 'From $672', 'United MileagePlus'),
    createTrendingDeal('lax-syd', 'LAX', 'Los Angeles', 'SYD', 'Sydney', 'Australia', '2026-11-12', '2026-11-22', 'From 40k pts', 'From $899', 'Qantas'),
    createTrendingDeal('sea-sin', 'SEA', 'Seattle', 'SIN', 'Singapore', 'Singapore', '2026-10-08', '2026-10-18', 'From 30k pts', 'From $718', 'Alaska Mileage Plan'),
  ],
  [
    createTrendingDeal('jfk-sju', 'JFK', 'New York', 'SJU', 'San Juan', 'Puerto Rico', '2026-07-24', '2026-07-31', 'From 8k pts', 'From $178', 'JetBlue TrueBlue'),
    createTrendingDeal('mia-cun', 'MIA', 'Miami', 'CUN', 'Cancún', 'Mexico', '2026-08-15', '2026-08-22', 'From 15k pts', 'From $219', 'United MileagePlus'),
    createTrendingDeal('bos-lis', 'BOS', 'Boston', 'LIS', 'Lisbon', 'Portugal', '2026-09-05', '2026-09-12', 'From 30k pts', 'From $468', 'TAP Miles&Go', { highlightRoundTrip: true }),
    createTrendingDeal('ord-mex', 'ORD', 'Chicago', 'MEX', 'Mexico City', 'Mexico', '2026-10-01', '2026-10-08', 'From 12k pts', 'From $245', 'Aeroplan'),
  ],
];

/** Home page picks — one standout route per region, not the Europe-heavy first carousel slide. */
export const HOME_TRENDING_DEALS: TrendingDeal[] = [
  TRENDING_DEAL_SLIDES[1][0], // LAX → HND (Asia-Pacific)
  TRENDING_DEAL_SLIDES[2][1], // MIA → CUN (Americas)
  TRENDING_DEAL_SLIDES[2][2], // BOS ⇄ LIS (Europe, round-trip highlight)
  createTrendingDeal(
    'home-jfk-dxb',
    'JFK',
    'New York',
    'DXB',
    'Dubai',
    'United Arab Emirates',
    '2026-10-09',
    '2026-10-19',
    'From 45k pts',
    'From $698',
    'Emirates Skywards',
  ),
];

export const TRENDING_DEAL_SLIDE_COUNT = TRENDING_DEAL_SLIDES.length;
