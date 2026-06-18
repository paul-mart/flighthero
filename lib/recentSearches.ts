import { extractAirportCode } from './airportCode';

export interface RecentSearch {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  tripType: 'one-way' | 'round-trip';
  searchType: 'cash' | 'points';
  cabinClass: string;
  adults: number;
  childrenCount: number;
  searchedAt: number;
}

export interface RecentSearchInput {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  tripType: 'one-way' | 'round-trip';
  searchType: 'cash' | 'points';
  cabinClass: string;
  adults: number;
  childrenCount: number;
}

const RECENT_KEY = 'flighthero:recent-searches';
const COUNT_KEY = 'flighthero:search-count';
export const MAX_RECENT_SEARCHES = 4;
export const MIN_SEARCHES_TO_SHOW_CONTINUE = 4;

function searchFingerprint(input: RecentSearchInput): string {
  return [
    input.origin.trim().toLowerCase(),
    input.destination.trim().toLowerCase(),
    input.departureDate,
    input.returnDate,
    input.tripType,
    input.searchType,
    input.cabinClass,
    String(input.adults),
    String(input.childrenCount),
  ].join('|');
}

function readRecentSearches(): RecentSearch[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentSearch[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecentSearch).slice(0, MAX_RECENT_SEARCHES);
  } catch {
    return [];
  }
}

function isRecentSearch(value: unknown): value is RecentSearch {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as RecentSearch;
  return (
    typeof item.origin === 'string'
    && typeof item.destination === 'string'
    && typeof item.departureDate === 'string'
    && typeof item.returnDate === 'string'
    && (item.tripType === 'one-way' || item.tripType === 'round-trip')
    && (item.searchType === 'cash' || item.searchType === 'points')
    && typeof item.cabinClass === 'string'
    && typeof item.adults === 'number'
    && typeof item.childrenCount === 'number'
    && typeof item.searchedAt === 'number'
  );
}

export function getSearchCount(): number {
  try {
    const raw = localStorage.getItem(COUNT_KEY);
    const parsed = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

export function getRecentSearches(): RecentSearch[] {
  return readRecentSearches();
}

export function shouldShowContinueSearching(): boolean {
  return getSearchCount() >= MIN_SEARCHES_TO_SHOW_CONTINUE && getRecentSearches().length > 0;
}

export function recordRecentSearch(input: RecentSearchInput): {
  recent: RecentSearch[];
  searchCount: number;
} {
  const fingerprint = searchFingerprint(input);
  const existing = readRecentSearches().filter(
    (item) => searchFingerprint(item) !== fingerprint,
  );
  const entry: RecentSearch = {
    ...input,
    origin: input.origin.trim(),
    destination: input.destination.trim(),
    searchedAt: Date.now(),
  };
  const recent = [entry, ...existing].slice(0, MAX_RECENT_SEARCHES);
  const searchCount = getSearchCount() + 1;

  localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  localStorage.setItem(COUNT_KEY, String(searchCount));

  return { recent, searchCount };
}

export function formatRecentRoute(origin: string, destination: string): string {
  const originCode = extractAirportCode(origin);
  const destinationCode = extractAirportCode(destination);
  const from = originCode ?? origin.trim();
  const to = destinationCode ?? destination.trim();
  return `${from} → ${to}`;
}

export function formatRecentDate(search: RecentSearch): string {
  const departure = formatDisplayDate(search.departureDate);
  if (search.tripType === 'round-trip' && search.returnDate) {
    return `${departure} – ${formatDisplayDate(search.returnDate)}`;
  }
  return departure;
}

function formatDisplayDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  const month = parsed.toLocaleDateString('en-US', { month: 'long' });
  const day = parsed.getDate();
  return `${month} ${day}${ordinalSuffix(day)}`;
}

function ordinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th';
  const last = day % 10;
  if (last === 1) return 'st';
  if (last === 2) return 'nd';
  if (last === 3) return 'rd';
  return 'th';
}
