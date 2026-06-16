import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase';
import {
  getUserProfile,
  signOut as authSignOut,
  patchUserPreferences,
  getFirestoreErrorMessage,
  type UserPreferences,
  type UserProfile,
} from '../lib/auth';
import {
  mergeProfilePreferences,
  readLocalPreferences,
  writeLocalPreferences,
} from '../lib/userPreferences';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  configured: boolean;
  signOut: () => Promise<void>;
  updatePreferences: (patch: Partial<UserPreferences>) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function resolveAccountMeta(
  authEmail: string,
  authDisplayName: string,
  profileData?: Partial<UserProfile> | null,
) {
  return {
    email: profileData?.email || authEmail,
    displayName: profileData?.displayName || authDisplayName,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured());
  const latestPreferencesRef = useRef<UserPreferences>({});
  const activeSyncUserRef = useRef<string | null>(null);
  const syncContextRef = useRef({ email: '', displayName: '' });
  const cloudSyncRef = useRef<Promise<void>>(Promise.resolve());

  const resetSyncState = () => {
    activeSyncUserRef.current = null;
    syncContextRef.current = { email: '', displayName: '' };
    latestPreferencesRef.current = {};
    cloudSyncRef.current = Promise.resolve();
  };

  const setSyncContext = (uid: string, email: string, displayName: string) => {
    activeSyncUserRef.current = uid;
    syncContextRef.current = { email, displayName };
    latestPreferencesRef.current = {};
    cloudSyncRef.current = Promise.resolve();
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const authEmail = firebaseUser.email ?? '';
        const authDisplayName = firebaseUser.displayName ?? '';
        setSyncContext(firebaseUser.uid, authEmail, authDisplayName);

        try {
          const nextProfile = await getUserProfile(firebaseUser.uid);
          if (activeSyncUserRef.current !== firebaseUser.uid) {
            return;
          }

          const preferences = mergeProfilePreferences(
            firebaseUser.uid,
            nextProfile?.preferences,
          );
          latestPreferencesRef.current = preferences;
          const { email, displayName } = resolveAccountMeta(authEmail, authDisplayName, nextProfile);
          syncContextRef.current = { email, displayName };
          setProfile({
            email,
            displayName,
            preferences,
            createdAt: nextProfile?.createdAt,
            updatedAt: nextProfile?.updatedAt,
            lastLoginAt: nextProfile?.lastLoginAt,
          });
        } catch {
          if (activeSyncUserRef.current !== firebaseUser.uid) {
            return;
          }

          const preferences = mergeProfilePreferences(firebaseUser.uid);
          latestPreferencesRef.current = preferences;
          setProfile({
            email: authEmail,
            displayName: authDisplayName,
            preferences,
          });
        }
      } else {
        resetSyncState();
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    profile,
    loading,
    configured: isFirebaseConfigured(),
    signOut: async () => {
      if (auth) {
        await authSignOut();
      }
    },
    updatePreferences: async (patch: Partial<UserPreferences>) => {
      if (!user) {
        throw new Error('You must be signed in to update preferences.');
      }

      const syncUserId = user.uid;
      const syncMeta = resolveAccountMeta(
        user.email ?? '',
        user.displayName ?? '',
        profile,
      );
      const preferenceBase = Object.keys(latestPreferencesRef.current).length > 0
        ? latestPreferencesRef.current
        : (readLocalPreferences(syncUserId) ?? profile?.preferences ?? {});
      const merged: UserPreferences = {
        ...preferenceBase,
        ...patch,
      };
      if (patch.cppValuations) {
        merged.cppValuations = {
          ...(preferenceBase.cppValuations ?? {}),
          ...patch.cppValuations,
        };
      }
      latestPreferencesRef.current = merged;
      writeLocalPreferences(syncUserId, merged);
      setProfile((current) => (current
        ? { ...current, preferences: merged }
        : {
          preferences: merged,
          email: syncMeta.email,
          displayName: syncMeta.displayName,
        }));

      if (!isFirebaseConfigured()) {
        return null;
      }

      const syncJob = cloudSyncRef.current.then(async () => {
        if (activeSyncUserRef.current !== syncUserId) {
          return;
        }

        const cloudPatch = patch.cppValuations
          ? { ...patch, cppValuations: merged.cppValuations }
          : patch;
        const cloudPreferences = await patchUserPreferences(syncUserId, cloudPatch, syncMeta);

        if (activeSyncUserRef.current !== syncUserId) {
          return;
        }

        latestPreferencesRef.current = {
          ...cloudPreferences,
          ...latestPreferencesRef.current,
        };
        writeLocalPreferences(syncUserId, latestPreferencesRef.current);
      });
      cloudSyncRef.current = syncJob.catch(() => undefined);

      try {
        await syncJob;
        if (activeSyncUserRef.current !== syncUserId) {
          return null;
        }
        return null;
      } catch (error) {
        if (activeSyncUserRef.current !== syncUserId) {
          return null;
        }
        return getFirestoreErrorMessage(error);
      }
    },
  }), [user, profile, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
