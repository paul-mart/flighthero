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

const EUROPE_DEALS: TrendingDeal[] = [
  createTrendingDeal('eu-bos-lhr', 'BOS', 'Boston', 'LHR', 'London', 'United Kingdom', '2026-09-12', '2026-09-19', 'From 30k pts', 'From $489', 'Aeroplan'),
  createTrendingDeal('eu-jfk-cdg', 'JFK', 'New York', 'CDG', 'Paris', 'France', '2026-10-03', '2026-10-10', 'From 25k pts', 'From $512', 'Flying Blue'),
  createTrendingDeal('eu-bos-dub', 'BOS', 'Boston', 'DUB', 'Dublin', 'Ireland', '2026-08-21', '2026-08-28', 'From 13k pts', 'From $398', 'Aer Lingus Avios'),
  createTrendingDeal('eu-ewr-fco', 'EWR', 'New York', 'FCO', 'Rome', 'Italy', '2026-11-07', '2026-11-14', 'From 33k pts', 'From $548', 'United MileagePlus'),
  createTrendingDeal('eu-ord-lhr', 'ORD', 'Chicago', 'LHR', 'London', 'United Kingdom', '2026-09-20', '2026-09-27', 'From 32k pts', 'From $502', 'Aeroplan'),
  createTrendingDeal('eu-lax-lhr', 'LAX', 'Los Angeles', 'LHR', 'London', 'United Kingdom', '2026-10-11', '2026-10-21', 'From 38k pts', 'From $612', 'British Airways Avios'),
  createTrendingDeal('eu-bos-lis', 'BOS', 'Boston', 'LIS', 'Lisbon', 'Portugal', '2026-09-05', '2026-09-12', 'From 30k pts', 'From $468', 'TAP Miles&Go'),
  createTrendingDeal('eu-jfk-bcn', 'JFK', 'New York', 'BCN', 'Barcelona', 'Spain', '2026-10-17', '2026-10-24', 'From 28k pts', 'From $498', 'Iberia Avios'),
  createTrendingDeal('eu-sfo-cdg', 'SFO', 'San Francisco', 'CDG', 'Paris', 'France', '2026-11-02', '2026-11-12', 'From 36k pts', 'From $589', 'Flying Blue'),
  createTrendingDeal('eu-sea-dub', 'SEA', 'Seattle', 'DUB', 'Dublin', 'Ireland', '2026-08-30', '2026-09-06', 'From 22k pts', 'From $445', 'Aer Lingus Avios'),
  createTrendingDeal('eu-mia-lis', 'MIA', 'Miami', 'LIS', 'Lisbon', 'Portugal', '2026-11-14', '2026-11-21', 'From 27k pts', 'From $478', 'TAP Miles&Go'),
  createTrendingDeal('eu-ord-fco', 'ORD', 'Chicago', 'FCO', 'Rome', 'Italy', '2026-10-25', '2026-11-01', 'From 34k pts', 'From $528', 'United MileagePlus'),
];

const ASIA_PACIFIC_DEALS: TrendingDeal[] = [
  createTrendingDeal('ap-lax-hnd', 'LAX', 'Los Angeles', 'HND', 'Tokyo', 'Japan', '2026-10-18', '2026-10-28', 'From 40k pts', 'From $789', 'ANA via Amex'),
  createTrendingDeal('ap-sfo-icn', 'SFO', 'San Francisco', 'ICN', 'Seoul', 'South Korea', '2026-09-25', '2026-10-05', 'From 35k pts', 'From $672', 'United MileagePlus'),
  createTrendingDeal('ap-lax-syd', 'LAX', 'Los Angeles', 'SYD', 'Sydney', 'Australia', '2026-11-12', '2026-11-22', 'From 40k pts', 'From $899', 'Qantas'),
  createTrendingDeal('ap-sea-sin', 'SEA', 'Seattle', 'SIN', 'Singapore', 'Singapore', '2026-10-08', '2026-10-18', 'From 30k pts', 'From $718', 'Alaska Mileage Plan'),
  createTrendingDeal('ap-sfo-tpe', 'SFO', 'San Francisco', 'TPE', 'Taipei', 'Taiwan', '2026-09-14', '2026-09-24', 'From 35k pts', 'From $698', 'EVA Infinity MileageLands'),
  createTrendingDeal('ap-lax-icn', 'LAX', 'Los Angeles', 'ICN', 'Seoul', 'South Korea', '2026-10-30', '2026-11-09', 'From 37k pts', 'From $698', 'Korean Air Skypass'),
  createTrendingDeal('ap-jfk-sgn', 'JFK', 'New York', 'SGN', 'Ho Chi Minh City', 'Vietnam', '2026-11-05', '2026-11-15', 'From 48k pts', 'From $812', 'Cathay Asia Miles'),
  createTrendingDeal('ap-ord-han', 'ORD', 'Chicago', 'HAN', 'Hanoi', 'Vietnam', '2026-09-08', '2026-09-18', 'From 42k pts', 'From $728', 'Aeroplan'),
  createTrendingDeal('ap-lax-sin', 'LAX', 'Los Angeles', 'SIN', 'Singapore', 'Singapore', '2026-10-22', '2026-11-01', 'From 33k pts', 'From $745', 'Singapore KrisFlyer'),
  createTrendingDeal('ap-sfo-syd', 'SFO', 'San Francisco', 'SYD', 'Sydney', 'Australia', '2026-12-03', '2026-12-13', 'From 42k pts', 'From $878', 'United MileagePlus'),
  createTrendingDeal('ap-bos-del', 'BOS', 'Boston', 'DEL', 'Delhi', 'India', '2026-10-06', '2026-10-20', 'From 35k pts', 'From $648', 'Air Canada Aeroplan'),
  createTrendingDeal('ap-lax-bkk', 'LAX', 'Los Angeles', 'BKK', 'Bangkok', 'Thailand', '2026-11-18', '2026-11-28', 'From 32k pts', 'From $689', 'Cathay Asia Miles'),
];

const AMERICAS_DEALS: TrendingDeal[] = [
  createTrendingDeal('am-jfk-sju', 'JFK', 'New York', 'SJU', 'San Juan', 'Puerto Rico', '2026-07-24', '2026-07-31', 'From 8k pts', 'From $178', 'JetBlue TrueBlue'),
  createTrendingDeal('am-mia-cun', 'MIA', 'Miami', 'CUN', 'Cancún', 'Mexico', '2026-08-15', '2026-08-22', 'From 15k pts', 'From $219', 'United MileagePlus'),
  createTrendingDeal('am-ord-mex', 'ORD', 'Chicago', 'MEX', 'Mexico City', 'Mexico', '2026-10-01', '2026-10-08', 'From 12k pts', 'From $245', 'Aeroplan'),
  createTrendingDeal('am-lax-cun', 'LAX', 'Los Angeles', 'CUN', 'Cancún', 'Mexico', '2026-09-19', '2026-09-26', 'From 18k pts', 'From $268', 'Southwest Rapid Rewards'),
  createTrendingDeal('am-jfk-bog', 'JFK', 'New York', 'BOG', 'Bogotá', 'Colombia', '2026-11-08', '2026-11-15', 'From 25k pts', 'From $398', 'Avianca LifeMiles'),
  createTrendingDeal('am-mia-gru', 'MIA', 'Miami', 'GRU', 'São Paulo', 'Brazil', '2026-10-04', '2026-10-14', 'From 28k pts', 'From $498', 'LATAM Pass'),
  createTrendingDeal('am-jfk-eze', 'JFK', 'New York', 'EZE', 'Buenos Aires', 'Argentina', '2026-08-28', '2026-09-08', 'From 35k pts', 'From $548', 'LATAM Pass'),
  createTrendingDeal('am-mia-sju', 'MIA', 'Miami', 'SJU', 'San Juan', 'Puerto Rico', '2026-09-12', '2026-09-19', 'From 7k pts', 'From $165', 'JetBlue TrueBlue'),
  createTrendingDeal('am-mia-gua', 'MIA', 'Miami', 'GUA', 'Guatemala City', 'Guatemala', '2026-10-14', '2026-10-21', 'From 12k pts', 'From $268', 'United MileagePlus'),
  createTrendingDeal('am-sea-cun', 'SEA', 'Seattle', 'CUN', 'Cancún', 'Mexico', '2026-12-06', '2026-12-13', 'From 20k pts', 'From $312', 'Alaska Mileage Plan'),
  createTrendingDeal('am-ord-cun', 'ORD', 'Chicago', 'CUN', 'Cancún', 'Mexico', '2026-07-18', '2026-07-25', 'From 16k pts', 'From $234', 'United MileagePlus'),
  createTrendingDeal('am-bos-sju', 'BOS', 'Boston', 'SJU', 'San Juan', 'Puerto Rico', '2026-08-08', '2026-08-15', 'From 10k pts', 'From $192', 'JetBlue TrueBlue'),
];

const MIDDLE_EAST_AFRICA_DEALS: TrendingDeal[] = [
  createTrendingDeal('me-jfk-dxb', 'JFK', 'New York', 'DXB', 'Dubai', 'United Arab Emirates', '2026-10-09', '2026-10-19', 'From 45k pts', 'From $698', 'Emirates Skywards'),
  createTrendingDeal('me-bos-ist', 'BOS', 'Boston', 'IST', 'Istanbul', 'Turkey', '2026-09-16', '2026-09-26', 'From 30k pts', 'From $548', 'Turkish Miles&Smiles'),
  createTrendingDeal('me-lax-dxb', 'LAX', 'Los Angeles', 'DXB', 'Dubai', 'United Arab Emirates', '2026-11-01', '2026-11-11', 'From 42k pts', 'From $672', 'Emirates Skywards'),
  createTrendingDeal('me-ord-cai', 'ORD', 'Chicago', 'CAI', 'Cairo', 'Egypt', '2026-10-23', '2026-11-02', 'From 38k pts', 'From $612', 'Egyptair Plus'),
  createTrendingDeal('me-jfk-cpt', 'JFK', 'New York', 'CPT', 'Cape Town', 'South Africa', '2026-12-10', '2026-12-24', 'From 55k pts', 'From $892', 'United MileagePlus'),
  createTrendingDeal('me-lax-nbo', 'LAX', 'Los Angeles', 'NBO', 'Nairobi', 'Kenya', '2026-11-15', '2026-11-29', 'From 48k pts', 'From $798', 'Kenya Airways Asante'),
  createTrendingDeal('me-sfo-dxb', 'SFO', 'San Francisco', 'DXB', 'Dubai', 'United Arab Emirates', '2026-09-28', '2026-10-08', 'From 44k pts', 'From $685', 'Emirates Skywards'),
  createTrendingDeal('me-jfk-doh', 'JFK', 'New York', 'DOH', 'Doha', 'Qatar', '2026-10-04', '2026-10-14', 'From 42k pts', 'From $658', 'Qatar Privilege Club'),
  createTrendingDeal('me-jfk-acc', 'JFK', 'New York', 'ACC', 'Accra', 'Ghana', '2026-08-22', '2026-09-01', 'From 40k pts', 'From $658', 'United MileagePlus'),
  createTrendingDeal('me-bos-cmn', 'BOS', 'Boston', 'CMN', 'Casablanca', 'Morocco', '2026-11-12', '2026-11-22', 'From 32k pts', 'From $528', 'Royal Air Maroc Safar'),
  createTrendingDeal('me-lax-jnb', 'LAX', 'Los Angeles', 'JNB', 'Johannesburg', 'South Africa', '2026-12-01', '2026-12-15', 'From 52k pts', 'From $845', 'United MileagePlus'),
  createTrendingDeal('me-ord-add', 'ORD', 'Chicago', 'ADD', 'Addis Ababa', 'Ethiopia', '2026-09-06', '2026-09-16', 'From 42k pts', 'From $672', 'Ethiopian ShebaMiles'),
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
