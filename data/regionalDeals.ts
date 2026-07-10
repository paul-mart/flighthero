import { createTrendingDeal, type TrendingDeal } from './trendingDeals';

export interface RegionalDealSection {
  id: string;
  title: string;
  description: string;
  slides: TrendingDeal[][];
}

const DEALS_PER_SLIDE = 4;

function chunkDealsIntoSlides(deals: TrendingDeal[]): TrendingDeal[][] {
  const slides: TrendingDeal[][] = [];
  for (let i = 0; i < deals.length; i += DEALS_PER_SLIDE) {
    slides.push(deals.slice(i, i + DEALS_PER_SLIDE));
  }
  return slides;
}

/** Round-trip highlights are interleaved at varied slide positions — never adjacent on a slide. */
const EUROPE_DEALS: TrendingDeal[] = [
  createTrendingDeal('eu-jfk-cdg', 'JFK', 'New York', 'CDG', 'Paris', 'France', '2026-10-03', '2026-10-10', 'From 45,000 pts', '—', 'Alaska Mileage Plan'),
  createTrendingDeal('eu-bos-dub', 'BOS', 'Boston', 'DUB', 'Dublin', 'Ireland', '2026-08-21', '2026-08-28', 'From 44,500 pts', '—', 'Air France/KLM Flying Blue'),
  createTrendingDeal('eu-bos-lhr', 'BOS', 'Boston', 'LHR', 'London', 'United Kingdom', '2026-09-12', '2026-09-19', 'From 21,000 pts', '—', 'Virgin Atlantic Flying Club', { highlightRoundTrip: true }),
  createTrendingDeal('eu-ewr-fco', 'EWR', 'New York', 'FCO', 'Rome', 'Italy', '2026-11-07', '2026-11-14', 'From 60,000 pts', '—', 'Virgin Australia Velocity'),
  createTrendingDeal('eu-lax-lhr', 'LAX', 'Los Angeles', 'LHR', 'London', 'United Kingdom', '2026-10-11', '2026-10-21', 'From 18,000 pts', '—', 'Virgin Atlantic Flying Club', { highlightRoundTrip: true }),
  createTrendingDeal('eu-ord-lhr', 'ORD', 'Chicago', 'LHR', 'London', 'United Kingdom', '2026-09-20', '2026-09-27', 'From 53,750 pts', '—', 'Qatar Privilege Club'),
  createTrendingDeal('eu-bos-lis', 'BOS', 'Boston', 'LIS', 'Lisbon', 'Portugal', '2026-09-05', '2026-09-12', 'From 50,000 pts', '—', 'Air France/KLM Flying Blue'),
  createTrendingDeal('eu-jfk-bcn', 'JFK', 'New York', 'BCN', 'Barcelona', 'Spain', '2026-10-17', '2026-10-24', 'From 55,000 pts', '—', 'Alaska Mileage Plan'),
  createTrendingDeal('eu-sea-dub', 'SEA', 'Seattle', 'DUB', 'Dublin', 'Ireland', '2026-08-30', '2026-09-06', 'From 60,000 pts', '—', 'American AAdvantage'),
  createTrendingDeal('eu-sfo-cdg', 'SFO', 'San Francisco', 'CDG', 'Paris', 'France', '2026-11-02', '2026-11-12', 'From 56,000 pts', '—', 'Virgin Atlantic Flying Club', { highlightRoundTrip: true }),
  createTrendingDeal('eu-mia-lis', 'MIA', 'Miami', 'LIS', 'Lisbon', 'Portugal', '2026-11-14', '2026-11-21', 'From 78,700 pts', '—', 'Air Canada Aeroplan'),
  createTrendingDeal('eu-ord-fco', 'ORD', 'Chicago', 'FCO', 'Rome', 'Italy', '2026-10-25', '2026-11-01', 'From 43,750 pts', '—', 'Air France/KLM Flying Blue', { highlightRoundTrip: true }),
];

const ASIA_PACIFIC_DEALS: TrendingDeal[] = [
  createTrendingDeal('ap-sfo-icn', 'SFO', 'San Francisco', 'ICN', 'Seoul', 'South Korea', '2026-09-25', '2026-10-05', 'From 70,000 pts', '—', 'Alaska Mileage Plan'),
  createTrendingDeal('ap-lax-hnd', 'LAX', 'Los Angeles', 'HND', 'Tokyo', 'Japan', '2026-10-18', '2026-10-28', 'From 70,000 pts', '—', 'American AAdvantage', { highlightRoundTrip: true }),
  createTrendingDeal('ap-lax-syd', 'LAX', 'Los Angeles', 'SYD', 'Sydney', 'Australia', '2026-11-12', '2026-11-22', 'From 75,000 pts', '—', 'American AAdvantage'),
  createTrendingDeal('ap-sea-sin', 'SEA', 'Seattle', 'SIN', 'Singapore', 'Singapore', '2026-10-08', '2026-10-18', 'From 85,000 pts', '—', 'Alaska Mileage Plan'),
  createTrendingDeal('ap-sfo-tpe', 'SFO', 'San Francisco', 'TPE', 'Taipei', 'Taiwan', '2026-09-14', '2026-09-24', 'From 68,000 pts', '—', 'Air France/KLM Flying Blue'),
  createTrendingDeal('ap-jfk-sgn', 'JFK', 'New York', 'SGN', 'Ho Chi Minh City', 'Vietnam', '2026-11-05', '2026-11-15', 'From 116,500 pts', '—', 'Air France/KLM Flying Blue'),
  createTrendingDeal('ap-lax-icn', 'LAX', 'Los Angeles', 'ICN', 'Seoul', 'South Korea', '2026-10-30', '2026-11-09', 'From 70,000 pts', '—', 'Alaska Mileage Plan', { highlightRoundTrip: true }),
  createTrendingDeal('ap-ord-han', 'ORD', 'Chicago', 'HKG', 'Hong Kong', 'Hong Kong', '2026-10-15', '2026-10-25', 'From 75,000 pts', '—', 'American AAdvantage'),
  createTrendingDeal('ap-lax-sin', 'LAX', 'Los Angeles', 'SIN', 'Singapore', 'Singapore', '2026-10-22', '2026-11-01', 'From 85,000 pts', '—', 'Alaska Mileage Plan', { highlightRoundTrip: true }),
  createTrendingDeal('ap-sfo-syd', 'SFO', 'San Francisco', 'SYD', 'Sydney', 'Australia', '2026-12-03', '2026-12-13', 'From 105,000 pts', '—', 'Alaska Mileage Plan'),
  createTrendingDeal('ap-lax-bkk', 'LAX', 'Los Angeles', 'BKK', 'Bangkok', 'Thailand', '2026-11-18', '2026-11-28', 'From 220,000 pts', '—', 'Turkish Miles&Smiles', { highlightRoundTrip: true }),
  createTrendingDeal('ap-bos-del', 'BOS', 'Boston', 'DEL', 'Delhi', 'India', '2026-10-06', '2026-10-20', 'From 134,001 pts', '—', 'Etihad Guest'),
];

const AMERICAS_DEALS: TrendingDeal[] = [
  createTrendingDeal('am-mia-cun', 'MIA', 'Miami', 'CUN', 'Cancún', 'Mexico', '2026-08-15', '2026-08-22', 'From 22,000 pts', '—', 'American AAdvantage'),
  createTrendingDeal('am-ord-mex', 'ORD', 'Chicago', 'MEX', 'Mexico City', 'Mexico', '2026-10-01', '2026-10-08', 'From 27,500 pts', '—', 'Air Canada Aeroplan'),
  createTrendingDeal('am-lax-cun', 'LAX', 'Los Angeles', 'CUN', 'Cancún', 'Mexico', '2026-09-19', '2026-09-26', 'From 18,000 pts', '—', 'American AAdvantage'),
  createTrendingDeal('am-jfk-sju', 'JFK', 'New York', 'SJU', 'San Juan', 'Puerto Rico', '2026-07-30', '2026-08-06', 'From 28,500 pts', '—', 'JetBlue TrueBlue', { highlightRoundTrip: true }),
  createTrendingDeal('am-jfk-bog', 'JFK', 'New York', 'BOG', 'Bogotá', 'Colombia', '2026-11-08', '2026-11-15', 'From 40,000 pts', '—', 'Air Canada Aeroplan'),
  createTrendingDeal('am-mia-gru', 'MIA', 'Miami', 'GRU', 'São Paulo', 'Brazil', '2026-10-04', '2026-10-14', 'From 50,000 pts', '—', 'Lufthansa', { highlightRoundTrip: true }),
  createTrendingDeal('am-jfk-eze', 'JFK', 'New York', 'EZE', 'Buenos Aires', 'Argentina', '2026-08-28', '2026-09-08', 'From 55,000 pts', '—', 'Alaska Mileage Plan'),
  createTrendingDeal('am-mia-gua', 'MIA', 'Miami', 'GUA', 'Guatemala City', 'Guatemala', '2026-10-14', '2026-10-21', 'From 20,000 pts', '—', 'Air Canada Aeroplan', { highlightRoundTrip: true }),
  createTrendingDeal('am-mia-sju', 'MIA', 'Miami', 'SJU', 'San Juan', 'Puerto Rico', '2026-09-12', '2026-09-19', 'From 25,000 pts', '—', 'American AAdvantage'),
  createTrendingDeal('am-sea-cun', 'SEA', 'Seattle', 'CUN', 'Cancún', 'Mexico', '2026-12-06', '2026-12-13', 'From 20,000 pts', '—', 'American AAdvantage'),
  createTrendingDeal('am-bos-sju', 'BOS', 'Boston', 'SJU', 'San Juan', 'Puerto Rico', '2026-08-08', '2026-08-15', 'From 32,000 pts', '—', 'JetBlue TrueBlue', { highlightRoundTrip: true }),
  createTrendingDeal('am-ord-cun', 'ORD', 'Chicago', 'CUN', 'Cancún', 'Mexico', '2026-07-30', '2026-08-06', 'From 22,500 pts', '—', 'American AAdvantage'),
];

const MIDDLE_EAST_AFRICA_DEALS: TrendingDeal[] = [
  createTrendingDeal('me-bos-ist', 'BOS', 'Boston', 'IST', 'Istanbul', 'Turkey', '2026-09-16', '2026-09-26', 'From 84,200 pts', '—', 'Air Canada Aeroplan'),
  createTrendingDeal('me-jfk-dxb', 'JFK', 'New York', 'DXB', 'Dubai', 'United Arab Emirates', '2026-10-09', '2026-10-19', 'From 95,200 pts', '—', 'Qantas Frequent Flyer', { highlightRoundTrip: true }),
  createTrendingDeal('me-lax-dxb', 'LAX', 'Los Angeles', 'DXB', 'Dubai', 'United Arab Emirates', '2026-11-01', '2026-11-11', 'From 106,200 pts', '—', 'Qantas Frequent Flyer'),
  createTrendingDeal('me-ord-cai', 'ORD', 'Chicago', 'CAI', 'Cairo', 'Egypt', '2026-10-23', '2026-11-02', 'From 88,000 pts', '—', 'United MileagePlus'),
  createTrendingDeal('me-lax-nbo', 'SFO', 'Seattle', 'NBO', 'Nairobi', 'Kenya', '2026-11-15', '2026-11-29', 'From 124,500 pts', '—', 'Air France/KLM Flying Blue', { highlightRoundTrip: true }),
  createTrendingDeal('me-jfk-cpt', 'JFK', 'New York', 'CPT', 'Cape Town', 'South Africa', '2026-12-10', '2026-12-24', 'From 118,500 pts', '—', 'Air France/KLM Flying Blue'),
  createTrendingDeal('me-sfo-dxb', 'SFO', 'San Francisco', 'DXB', 'Dubai', 'United Arab Emirates', '2026-09-28', '2026-10-08', 'From 106,200 pts', '—', 'Qantas Frequent Flyer'),
  createTrendingDeal('me-jfk-acc', 'JFK', 'New York', 'ACC', 'Accra', 'Ghana', '2026-08-22', '2026-09-01', 'From 103,500 pts', '—', 'Air France/KLM Flying Blue', { highlightRoundTrip: true }),
  createTrendingDeal('me-jfk-doh', 'JFK', 'New York', 'DOH', 'Doha', 'Qatar', '2026-10-04', '2026-10-14', 'From 70,000 pts', '—', 'Alaska Mileage Plan'),
  createTrendingDeal('me-bos-cmn', 'BOS', 'Boston', 'CMN', 'Casablanca', 'Morocco', '2026-11-12', '2026-11-22', 'From 58,000 pts', '—', 'Air France/KLM Flying Blue'),
  createTrendingDeal('me-lax-jnb', 'JFK', 'New York', 'NBO', 'Nairobi', 'Kenya', '2026-11-15', '2026-11-29', 'From 74,000 pts', '—', 'Virgin Atlantic Flying Club'),
  createTrendingDeal('me-ord-add', 'ORD', 'Chicago', 'ADD', 'Addis Ababa', 'Ethiopia', '2026-09-06', '2026-09-16', 'From 95,000 pts', '—', 'Ethiopian', { highlightRoundTrip: true }),
];

export const REGIONAL_DEAL_SECTIONS: RegionalDealSection[] = [
  {
    id: 'europe',
    title: 'Europe',
    description: 'Saver awards to classic cities across the UK, France, Italy, and beyond.',
    slides: chunkDealsIntoSlides(EUROPE_DEALS),
  },
  {
    id: 'asia-pacific',
    title: 'Asia & Pacific',
    description: 'Long-haul redemptions to Japan, Korea, Taiwan, Vietnam, Singapore, and beyond.',
    slides: chunkDealsIntoSlides(ASIA_PACIFIC_DEALS),
  },
  {
    id: 'americas',
    title: 'Americas & Caribbean',
    description: 'Caribbean getaways, Mexico, and South & Central America from major US hubs.',
    slides: chunkDealsIntoSlides(AMERICAS_DEALS),
  },
  {
    id: 'middle-east-africa',
    title: 'Middle East & Africa',
    description: 'Award seats to Dubai, Istanbul, Cape Town, and emerging routes.',
    slides: chunkDealsIntoSlides(MIDDLE_EAST_AFRICA_DEALS),
  },
];
