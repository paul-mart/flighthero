import type { UserPreferences } from './auth';

const STORAGE_PREFIX = 'flighthero:prefs:';

function storageKey(uid: string): string {
  return `${STORAGE_PREFIX}${uid}`;
}

export function readLocalPreferences(uid: string): UserPreferences | null {
  try {
    const raw = localStorage.getItem(storageKey(uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserPreferences;
    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

export function writeLocalPreferences(uid: string, preferences: UserPreferences): void {
  localStorage.setItem(storageKey(uid), JSON.stringify(preferences));
}

export function mergeProfilePreferences(
  uid: string,
  profilePreferences?: UserPreferences,
): UserPreferences {
  const local = readLocalPreferences(uid);
  return {
    ...local,
    ...profilePreferences,
  };
}
