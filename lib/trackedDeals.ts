import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

export interface TrackedDealSnapshot {
  pointsRequired: number;
  taxesAndFees: number;
  mileageProgram?: string;
  carrier?: string;
  flightNumber?: string;
}

export interface TrackedDeal {
  id: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  tripType: 'one-way' | 'round-trip';
  cabinClass: string;
  adults: number;
  childrenCount: number;
  alertsEnabled?: boolean;
  lastAlertSentAt?: number;
  lastCheckedAt?: number;
  snapshot?: TrackedDealSnapshot & { trackedAt: number };
  createdAt: number;
  updatedAt: number;
}

export interface TrackedDealInput {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  tripType: 'one-way' | 'round-trip';
  cabinClass: string;
  adults: number;
  childrenCount: number;
  alertsEnabled?: boolean;
  snapshot?: TrackedDealSnapshot;
}

export const MAX_TRACKED_DEALS = 20;
export const MAX_PRICE_ALERTS = 1;

export const PRICE_ALERT_TOOLTIP_ACTIVE = 'Price alerts on for this route — click to turn off';
export const PRICE_ALERT_TOOLTIP_AVAILABLE = 'Notify me when prices drop';
export const PRICE_ALERT_TOOLTIP_SWITCH = 'Free accounts include 1 price-drop alert. Click to switch alerts to this route. Track multiple routes with Premium (coming soon).';

const LOCAL_KEY_PREFIX = 'flighthero:tracked-deals';

function localStorageKey(userId: string): string {
  return `${LOCAL_KEY_PREFIX}:${userId}`;
}

export function findDealWithAlerts(deals: TrackedDeal[]): TrackedDeal | undefined {
  return deals.find((deal) => deal.alertsEnabled);
}

export function formatTrackedCabinClass(cabinClass: string): string {
  const labels: Record<string, string> = {
    economy: 'Economy',
    'premium-economy': 'Premium economy',
    business: 'Business',
    first: 'First',
  };
  return labels[cabinClass] ?? cabinClass;
}

export function applyExclusivePriceAlerts(
  deals: TrackedDeal[],
  dealId: string,
  alertsEnabled: boolean,
  now: number,
): TrackedDeal[] {
  return deals.map((deal) => {
    if (deal.id === dealId) {
      return { ...deal, alertsEnabled, updatedAt: now };
    }
    if (alertsEnabled && deal.alertsEnabled) {
      return { ...deal, alertsEnabled: false, updatedAt: now };
    }
    return deal;
  });
}

function userDocRef(userId: string) {
  if (!db) {
    throw new Error('Firestore is not configured.');
  }
  return doc(db, 'users', userId);
}

export function trackedDealFingerprint(input: Pick<
  TrackedDealInput,
  | 'origin'
  | 'destination'
  | 'departureDate'
  | 'returnDate'
  | 'tripType'
  | 'cabinClass'
  | 'adults'
  | 'childrenCount'
>): string {
  return [
    input.origin.trim().toLowerCase(),
    input.destination.trim().toLowerCase(),
    input.departureDate,
    input.returnDate,
    input.tripType,
    input.cabinClass,
    String(input.adults),
    String(input.childrenCount),
  ].join('|');
}

function dealDocId(fingerprint: string): string {
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i += 1) {
    hash = ((hash << 5) - hash) + fingerprint.charCodeAt(i);
    hash |= 0;
  }
  return `deal_${Math.abs(hash).toString(36)}`;
}

function isTrackedDeal(value: unknown): value is TrackedDeal {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as TrackedDeal;
  return (
    typeof item.id === 'string'
    && typeof item.origin === 'string'
    && typeof item.destination === 'string'
    && typeof item.departureDate === 'string'
    && typeof item.returnDate === 'string'
    && (item.tripType === 'one-way' || item.tripType === 'round-trip')
    && typeof item.cabinClass === 'string'
    && typeof item.adults === 'number'
    && typeof item.childrenCount === 'number'
    && typeof item.createdAt === 'number'
    && typeof item.updatedAt === 'number'
  );
}

function readLocalTrackedDeals(userId: string): TrackedDeal[] {
  try {
    const raw = localStorage.getItem(localStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TrackedDeal[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isTrackedDeal).slice(0, MAX_TRACKED_DEALS);
  } catch {
    return [];
  }
}

function writeLocalTrackedDeals(userId: string, deals: TrackedDeal[]): void {
  localStorage.setItem(localStorageKey(userId), JSON.stringify(deals.slice(0, MAX_TRACKED_DEALS)));
}

function normalizeDeal(raw: Record<string, unknown>, id: string): TrackedDeal | null {
  const createdAt = typeof raw.createdAt === 'number'
    ? raw.createdAt
    : Date.now();
  const updatedAt = typeof raw.updatedAt === 'number'
    ? raw.updatedAt
    : createdAt;

  const deal: TrackedDeal = {
    id,
    origin: String(raw.origin ?? ''),
    destination: String(raw.destination ?? ''),
    departureDate: String(raw.departureDate ?? ''),
    returnDate: String(raw.returnDate ?? ''),
    tripType: raw.tripType === 'one-way' ? 'one-way' : 'round-trip',
    cabinClass: String(raw.cabinClass ?? 'economy'),
    adults: typeof raw.adults === 'number' ? raw.adults : 1,
    childrenCount: typeof raw.childrenCount === 'number' ? raw.childrenCount : 0,
    alertsEnabled: raw.alertsEnabled === true,
    lastAlertSentAt: typeof raw.lastAlertSentAt === 'number' ? raw.lastAlertSentAt : undefined,
    lastCheckedAt: typeof raw.lastCheckedAt === 'number' ? raw.lastCheckedAt : undefined,
    createdAt,
    updatedAt,
  };

  if (raw.snapshot && typeof raw.snapshot === 'object') {
    const snapshot = raw.snapshot as Record<string, unknown>;
    if (typeof snapshot.pointsRequired === 'number' && typeof snapshot.taxesAndFees === 'number') {
      deal.snapshot = {
        pointsRequired: snapshot.pointsRequired,
        taxesAndFees: snapshot.taxesAndFees,
        mileageProgram: typeof snapshot.mileageProgram === 'string' ? snapshot.mileageProgram : undefined,
        carrier: typeof snapshot.carrier === 'string' ? snapshot.carrier : undefined,
        flightNumber: typeof snapshot.flightNumber === 'string' ? snapshot.flightNumber : undefined,
        trackedAt: typeof snapshot.trackedAt === 'number' ? snapshot.trackedAt : updatedAt,
      };
    }
  }

  return isTrackedDeal(deal) ? deal : null;
}

function parseDealsArray(raw: unknown): TrackedDeal[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => {
      if (typeof item !== 'object' || item === null) return null;
      const record = item as Record<string, unknown>;
      const id = typeof record.id === 'string' ? record.id : `deal_${index}`;
      return normalizeDeal(record, id);
    })
    .filter((deal): deal is TrackedDeal => deal !== null)
    .slice(0, MAX_TRACKED_DEALS);
}

function sortDeals(deals: TrackedDeal[]): TrackedDeal[] {
  return [...deals].sort((left, right) => right.updatedAt - left.updatedAt);
}

function omitUndefinedFields<T extends Record<string, unknown>>(value: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
  );
}

function toFirestoreDeal(deal: TrackedDeal): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id: deal.id,
    origin: deal.origin,
    destination: deal.destination,
    departureDate: deal.departureDate,
    returnDate: deal.returnDate,
    tripType: deal.tripType,
    cabinClass: deal.cabinClass,
    adults: deal.adults,
    childrenCount: deal.childrenCount,
    createdAt: deal.createdAt,
    updatedAt: deal.updatedAt,
  };

  if (deal.alertsEnabled) {
    payload.alertsEnabled = true;
  }
  if (deal.lastAlertSentAt != null) {
    payload.lastAlertSentAt = deal.lastAlertSentAt;
  }
  if (deal.lastCheckedAt != null) {
    payload.lastCheckedAt = deal.lastCheckedAt;
  }

  if (deal.snapshot) {
    payload.snapshot = omitUndefinedFields({
      pointsRequired: deal.snapshot.pointsRequired,
      taxesAndFees: deal.snapshot.taxesAndFees,
      trackedAt: deal.snapshot.trackedAt,
      mileageProgram: deal.snapshot.mileageProgram,
      carrier: deal.snapshot.carrier,
      flightNumber: deal.snapshot.flightNumber,
    });
  }

  return payload;
}

async function writeCloudTrackedDeals(userId: string, deals: TrackedDeal[]): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  await setDoc(userDocRef(userId), {
    trackedDeals: deals.map(toFirestoreDeal),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export function findTrackedDeal(
  deals: TrackedDeal[],
  input: TrackedDealInput,
): TrackedDeal | undefined {
  const fingerprint = trackedDealFingerprint(input);
  return deals.find((deal) => trackedDealFingerprint(deal) === fingerprint);
}

export function isTrackedDealSaved(deals: TrackedDeal[], input: TrackedDealInput): boolean {
  return Boolean(findTrackedDeal(deals, input));
}

export function subscribeTrackedDeals(
  userId: string,
  onChange: (deals: TrackedDeal[]) => void,
  onError?: (error: unknown) => void,
): Unsubscribe {
  if (!isFirebaseConfigured() || !db) {
    onChange(readLocalTrackedDeals(userId));
    return () => undefined;
  }

  return onSnapshot(
    userDocRef(userId),
    (snapshot) => {
      const deals = parseDealsArray(snapshot.data()?.trackedDeals);
      writeLocalTrackedDeals(userId, deals);
      onChange(sortDeals(deals));
    },
    (error) => {
      onChange(readLocalTrackedDeals(userId));
      onError?.(error);
    },
  );
}

export async function saveTrackedDeal(
  userId: string,
  input: TrackedDealInput,
): Promise<{ deal: TrackedDeal; error?: string }> {
  const now = Date.now();
  const fingerprint = trackedDealFingerprint(input);
  const id = dealDocId(fingerprint);
  const existing = readLocalTrackedDeals(userId);
  const withoutDuplicate = existing.filter((deal) => trackedDealFingerprint(deal) !== fingerprint);
  const previous = existing.find((deal) => trackedDealFingerprint(deal) === fingerprint);

  const deal: TrackedDeal = {
    id,
    origin: input.origin.trim(),
    destination: input.destination.trim(),
    departureDate: input.departureDate,
    returnDate: input.returnDate,
    tripType: input.tripType,
    cabinClass: input.cabinClass,
    adults: input.adults,
    childrenCount: input.childrenCount,
    alertsEnabled: input.alertsEnabled ?? previous?.alertsEnabled ?? false,
    snapshot: input.snapshot
      ? { ...input.snapshot, trackedAt: now }
      : previous?.snapshot,
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  };

  const next = sortDeals(applyExclusivePriceAlerts(
    [deal, ...withoutDuplicate],
    deal.id,
    Boolean(deal.alertsEnabled),
    now,
  )).slice(0, MAX_TRACKED_DEALS);
  writeLocalTrackedDeals(userId, next);

  if (!isFirebaseConfigured() || !db) {
    return { deal };
  }

  try {
    await writeCloudTrackedDeals(userId, next);
    return { deal };
  } catch (error) {
    return {
      deal,
      error: error instanceof Error ? error.message : 'Could not sync tracked deal to the cloud.',
    };
  }
}

export async function removeTrackedDeal(userId: string, dealId: string): Promise<void> {
  const next = readLocalTrackedDeals(userId).filter((deal) => deal.id !== dealId);
  writeLocalTrackedDeals(userId, next);

  if (!isFirebaseConfigured() || !db) {
    return;
  }

  await writeCloudTrackedDeals(userId, next);
}

export async function updateTrackedDealAlerts(
  userId: string,
  dealId: string,
  alertsEnabled: boolean,
): Promise<{ deals: TrackedDeal[]; error?: string }> {
  const existing = readLocalTrackedDeals(userId);
  const index = existing.findIndex((deal) => deal.id === dealId);
  if (index < 0) {
    return { deals: existing };
  }

  const now = Date.now();
  const next = sortDeals(applyExclusivePriceAlerts(existing, dealId, alertsEnabled, now));
  writeLocalTrackedDeals(userId, next);

  if (!isFirebaseConfigured() || !db) {
    return { deals: next };
  }

  try {
    await writeCloudTrackedDeals(userId, next);
    return { deals: next };
  } catch (error) {
    return {
      deals: next,
      error: error instanceof Error ? error.message : 'Could not sync alert preference.',
    };
  }
}

export async function migrateLocalTrackedDealsToCloud(userId: string): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;

  const localDeals = readLocalTrackedDeals(userId);
  if (localDeals.length === 0) return;

  const snapshot = await getDoc(userDocRef(userId));
  const cloudDeals = parseDealsArray(snapshot.data()?.trackedDeals);
  if (cloudDeals.length > 0) return;

  await writeCloudTrackedDeals(userId, localDeals);
}

export function trackedDealToSearchInput(deal: TrackedDeal): TrackedDealInput {
  return {
    origin: deal.origin,
    destination: deal.destination,
    departureDate: deal.departureDate,
    returnDate: deal.returnDate,
    tripType: deal.tripType,
    cabinClass: deal.cabinClass,
    adults: deal.adults,
    childrenCount: deal.childrenCount,
  };
}
