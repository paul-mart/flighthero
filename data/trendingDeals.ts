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

/** Three slides of four curated award routes with live-checked starting prices (Seats.aero, Jul 2026). */
export const TRENDING_DEAL_SLIDES: TrendingDeal[][] = [
  [
    createTrendingDeal('bos-lhr', 'BOS', 'Boston', 'LHR', 'London', 'United Kingdom', '2026-09-12', '2026-09-19', 'From 21,000 pts', '—', 'Virgin Atlantic Flying Club'),
    createTrendingDeal('jfk-cdg', 'JFK', 'New York', 'CDG', 'Paris', 'France', '2026-10-03', '2026-10-10', 'From 45,000 pts', '—', 'Alaska Mileage Plan'),
    createTrendingDeal('bos-dub', 'BOS', 'Boston', 'DUB', 'Dublin', 'Ireland', '2026-08-21', '2026-08-28', 'From 44,500 pts', '—', 'Air France/KLM Flying Blue'),
    createTrendingDeal('ewr-fco', 'EWR', 'New York', 'FCO', 'Rome', 'Italy', '2026-11-07', '2026-11-14', 'From 60,000 pts', '—', 'Virgin Australia Velocity'),
  ],
  [
    createTrendingDeal('lax-hnd', 'LAX', 'Los Angeles', 'HND', 'Tokyo', 'Japan', '2026-10-18', '2026-10-28', 'From 70,000 pts', '—', 'American AAdvantage'),
    createTrendingDeal('sfo-icn', 'SFO', 'San Francisco', 'ICN', 'Seoul', 'South Korea', '2026-09-25', '2026-10-05', 'From 70,000 pts', '—', 'Alaska Mileage Plan'),
    createTrendingDeal('lax-syd', 'LAX', 'Los Angeles', 'SYD', 'Sydney', 'Australia', '2026-11-12', '2026-11-22', 'From 75,000 pts', '—', 'American AAdvantage'),
    createTrendingDeal('sea-sin', 'SEA', 'Seattle', 'SIN', 'Singapore', 'Singapore', '2026-10-08', '2026-10-18', 'From 85,000 pts', '—', 'Alaska Mileage Plan'),
  ],
  [
    createTrendingDeal('jfk-sju', 'JFK', 'New York', 'SJU', 'San Juan', 'Puerto Rico', '2026-07-30', '2026-08-06', 'From 28,500 pts', '—', 'JetBlue TrueBlue'),
    createTrendingDeal('mia-cun', 'MIA', 'Miami', 'CUN', 'Cancún', 'Mexico', '2026-08-15', '2026-08-22', 'From 22,000 pts', '—', 'American AAdvantage'),
    createTrendingDeal('bos-lis', 'BOS', 'Boston', 'LIS', 'Lisbon', 'Portugal', '2026-09-05', '2026-09-12', 'From 50,000 pts', '—', 'Air France/KLM Flying Blue', { highlightRoundTrip: true }),
    createTrendingDeal('ord-mex', 'ORD', 'Chicago', 'MEX', 'Mexico City', 'Mexico', '2026-10-01', '2026-10-08', 'From 27,500 pts', '—', 'Air Canada Aeroplan'),
  ],
];

/** Home page picks — one standout route per region, not the Europe-heavy first carousel slide. */
export const HOME_TRENDING_DEALS: TrendingDeal[] = [
  TRENDING_DEAL_SLIDES[1][0], // LAX → HND (Asia-Pacific)
  TRENDING_DEAL_SLIDES[2][1], // MIA → CUN (Americas)
  TRENDING_DEAL_SLIDES[2][2], // BOS ⇄ LIS (Europe, round-trip highlight)
  createTrendingDeal('home-jfk-dxb', 'JFK', 'New York', 'DXB', 'Dubai', 'United Arab Emirates', '2026-10-09', '2026-10-19', 'From 95,200 pts', '—', 'Qantas Frequent Flyer'),
];

export const TRENDING_DEAL_SLIDE_COUNT = TRENDING_DEAL_SLIDES.length;
