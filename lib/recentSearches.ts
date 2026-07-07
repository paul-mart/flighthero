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
  lowestPoints?: number;
  lowestCash?: number;
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

const RECENT_KEY_PREFIX = 'flighthero:recent-searches';
const COUNT_KEY_PREFIX = 'flighthero:search-count';
const LEGACY_RECENT_KEY = 'flighthero:recent-searches';
const LEGACY_COUNT_KEY = 'flighthero:search-count';
export const MAX_RECENT_SEARCHES = 4;
export const MIN_SEARCHES_TO_SHOW_CONTINUE = 4;

function recentStorageKey(userId: string): string {
  return `${RECENT_KEY_PREFIX}:${userId}`;
}

function countStorageKey(userId: string): string {
  return `${COUNT_KEY_PREFIX}:${userId}`;
}

function migrateLegacyStorage(userId: string): void {
  const userRecentKey = recentStorageKey(userId);
  const userCountKey = countStorageKey(userId);
  if (localStorage.getItem(userRecentKey) || localStorage.getItem(userCountKey)) {
    return;
  }

  const legacyRecent = localStorage.getItem(LEGACY_RECENT_KEY);
  const legacyCount = localStorage.getItem(LEGACY_COUNT_KEY);
  if (!legacyRecent && !legacyCount) return;

  if (legacyRecent) {
    localStorage.setItem(userRecentKey, legacyRecent);
  }
  if (legacyCount) {
    localStorage.setItem(userCountKey, legacyCount);
  }
}

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

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function parseSearchDate(isoDate: string): Date | null {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  if (
    date.getFullYear() !== year
    || date.getMonth() !== month
    || date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function isFutureSearch(search: RecentSearch): boolean {
  const today = startOfToday();
  const departure = parseSearchDate(search.departureDate);
  if (!departure || departure < today) return false;

  if (search.tripType === 'round-trip' && search.returnDate) {
    const returnDate = parseSearchDate(search.returnDate);
    if (!returnDate || returnDate < today) return false;
  }

  return true;
}

function readRecentSearches(userId: string): RecentSearch[] {
  migrateLegacyStorage(userId);
  try {
    const raw = localStorage.getItem(recentStorageKey(userId));
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
    && (item.returnDate === undefined || typeof item.returnDate === 'string')
    && (item.tripType === 'one-way' || item.tripType === 'round-trip')
    && (item.searchType === 'cash' || item.searchType === 'points')
    && typeof item.cabinClass === 'string'
    && typeof item.adults === 'number'
    && typeof item.childrenCount === 'number'
    && typeof item.searchedAt === 'number'
    && (item.lowestPoints === undefined || typeof item.lowestPoints === 'number')
    && (item.lowestCash === undefined || typeof item.lowestCash === 'number')
  );
}

export function getSearchCount(userId: string | null | undefined): number {
  if (!userId) return 0;
  migrateLegacyStorage(userId);
  try {
    const raw = localStorage.getItem(countStorageKey(userId));
    const parsed = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

export function getRecentSearches(userId: string | null | undefined): RecentSearch[] {
  if (!userId) return [];
  return readRecentSearches(userId).filter(isFutureSearch);
}

export function shouldShowContinueSearching(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return getSearchCount(userId) >= MIN_SEARCHES_TO_SHOW_CONTINUE
    && getRecentSearches(userId).length > 0;
}

export function loadRecentSearchState(userId: string): {
  recent: RecentSearch[];
  searchCount: number;
} {
  return {
    recent: getRecentSearches(userId),
    searchCount: getSearchCount(userId),
  };
}

export function recordRecentSearch(
  userId: string,
  input: RecentSearchInput,
): {
  recent: RecentSearch[];
  searchCount: number;
} {
  const fingerprint = searchFingerprint(input);
  const existing = readRecentSearches(userId).filter(
    (item) => searchFingerprint(item) !== fingerprint,
  );
  const entry: RecentSearch = {
    ...input,
    origin: input.origin.trim(),
    destination: input.destination.trim(),
    searchedAt: Date.now(),
  };
  const recent = [entry, ...existing].slice(0, MAX_RECENT_SEARCHES);
  const searchCount = getSearchCount(userId) + 1;

  localStorage.setItem(recentStorageKey(userId), JSON.stringify(recent));
  localStorage.setItem(countStorageKey(userId), String(searchCount));

  return { recent: recent.filter(isFutureSearch), searchCount };
}

export interface RecentSearchPricing {
  lowestPoints?: number;
  lowestCash?: number;
}

export function updateRecentSearchPricing(
  userId: string,
  input: RecentSearchInput,
  pricing: RecentSearchPricing,
): {
  recent: RecentSearch[];
  searchCount: number;
} {
  const fingerprint = searchFingerprint(input);
  const recent = readRecentSearches(userId).map((item) => {
    if (searchFingerprint(item) !== fingerprint) return item;
    return {
      ...item,
      ...(pricing.lowestPoints != null && pricing.lowestPoints > 0
        ? { lowestPoints: pricing.lowestPoints }
        : {}),
      ...(pricing.lowestCash != null && pricing.lowestCash > 0
        ? { lowestCash: pricing.lowestCash }
        : {}),
    };
  });

  localStorage.setItem(recentStorageKey(userId), JSON.stringify(recent));

  return {
    recent: recent.filter(isFutureSearch),
    searchCount: getSearchCount(userId),
  };
}

export function formatRecentPointsLabel(points?: number): string {
  if (points == null || points <= 0) return 'Points';
  if (points >= 1000) {
    const thousands = points / 1000;
    const rounded = thousands >= 10
      ? Math.round(thousands)
      : Math.round(thousands * 10) / 10;
    const label = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(/\.0$/, '');
    return `From ${label}k pts`;
  }
  return `From ${points.toLocaleString()} pts`;
}

export function formatRecentCashLabel(cash?: number): string {
  if (cash == null || cash <= 0) return 'Cash';
  return `From $${Math.round(cash).toLocaleString()}`;
}

export function formatRecentRoute(
  origin: string,
  destination: string,
  tripType: RecentSearch['tripType'] = 'one-way',
): string {
  const originCode = extractAirportCode(origin);
  const destinationCode = extractAirportCode(destination);
  const from = originCode ?? origin.trim();
  const to = destinationCode ?? destination.trim();
  const arrow = tripType === 'round-trip' ? '⇄' : '→';
  return `${from} ${arrow} ${to}`;
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
