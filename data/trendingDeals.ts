import { getDestinationImage } from './destinationImages';

export interface TrendingDeal {
  id: string;
  origin: string;
  destination: string;
  city: string;
  country: string;
  routeLabel: string;
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

function deal(
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
): TrendingDeal {
  const origin = `${originName} (${originCode})`;
  const destination = `${destCity} (${destCode})`;
  return {
    id,
    origin,
    destination,
    city: destCity,
    country,
    routeLabel: `${originCode} → ${destCode}`,
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
    deal('bos-lhr', 'BOS', 'Boston', 'LHR', 'London', 'United Kingdom', '2026-09-12', '2026-09-19', 'From 30k pts', 'From $489', 'Aeroplan'),
    deal('jfk-cdg', 'JFK', 'New York', 'CDG', 'Paris', 'France', '2026-10-03', '2026-10-10', 'From 25k pts', 'From $512', 'Flying Blue'),
    deal('bos-dub', 'BOS', 'Boston', 'DUB', 'Dublin', 'Ireland', '2026-08-21', '2026-08-28', 'From 13k pts', 'From $398', 'Aer Lingus Avios'),
    deal('ewr-fco', 'EWR', 'New York', 'FCO', 'Rome', 'Italy', '2026-11-07', '2026-11-14', 'From 33k pts', 'From $548', 'United MileagePlus'),
  ],
  [
    deal('lax-hnd', 'LAX', 'Los Angeles', 'HND', 'Tokyo', 'Japan', '2026-10-18', '2026-10-28', 'From 40k pts', 'From $789', 'ANA via Amex'),
    deal('sfo-icn', 'SFO', 'San Francisco', 'ICN', 'Seoul', 'South Korea', '2026-09-25', '2026-10-05', 'From 35k pts', 'From $672', 'United MileagePlus'),
    deal('lax-syd', 'LAX', 'Los Angeles', 'SYD', 'Sydney', 'Australia', '2026-11-12', '2026-11-22', 'From 40k pts', 'From $899', 'Qantas'),
    deal('sea-sin', 'SEA', 'Seattle', 'SIN', 'Singapore', 'Singapore', '2026-10-08', '2026-10-18', 'From 30k pts', 'From $718', 'Alaska Mileage Plan'),
  ],
  [
    deal('jfk-sju', 'JFK', 'New York', 'SJU', 'San Juan', 'Puerto Rico', '2026-07-24', '2026-07-31', 'From 8k pts', 'From $178', 'JetBlue TrueBlue'),
    deal('mia-cun', 'MIA', 'Miami', 'CUN', 'Cancún', 'Mexico', '2026-08-15', '2026-08-22', 'From 15k pts', 'From $219', 'United MileagePlus'),
    deal('bos-lis', 'BOS', 'Boston', 'LIS', 'Lisbon', 'Portugal', '2026-09-05', '2026-09-12', 'From 30k pts', 'From $468', 'TAP Miles&Go'),
    deal('ord-mex', 'ORD', 'Chicago', 'MEX', 'Mexico City', 'Mexico', '2026-10-01', '2026-10-08', 'From 12k pts', 'From $245', 'Aeroplan'),
  ],
];

export const TRENDING_DEAL_SLIDE_COUNT = TRENDING_DEAL_SLIDES.length;
