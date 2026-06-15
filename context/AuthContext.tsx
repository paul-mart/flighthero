import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase';
import {
  getUserProfile,
  signOut as authSignOut,
  updateUserPreferences,
  getFirestoreErrorMessage,
  type UserPreferences,
  type UserProfile,
} from '../lib/auth';
import {
  mergeProfilePreferences,
  writeLocalPreferences,
} from '../lib/userPreferences';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  configured: boolean;
  signOut: () => Promise<void>;
  updatePreferences: (preferences: UserPreferences) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured());

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const nextProfile = await getUserProfile(firebaseUser.uid);
          const preferences = mergeProfilePreferences(
            firebaseUser.uid,
            nextProfile?.preferences,
          );
          setProfile(nextProfile
            ? { ...nextProfile, preferences }
            : {
              email: firebaseUser.email ?? '',
              displayName: firebaseUser.displayName ?? '',
              preferences,
            });
        } catch {
          const preferences = mergeProfilePreferences(firebaseUser.uid);
          setProfile({
            email: firebaseUser.email ?? '',
            displayName: firebaseUser.displayName ?? '',
            preferences,
          });
        }
      } else {
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
    updatePreferences: async (preferences: UserPreferences) => {
      if (!user) {
        throw new Error('You must be signed in to update preferences.');
      }

      writeLocalPreferences(user.uid, preferences);
      setProfile((current) => (current
        ? { ...current, preferences }
        : {
          preferences,
          email: user.email ?? '',
          displayName: user.displayName ?? '',
        }));

      if (!isFirebaseConfigured()) {
        return null;
      }

      try {
        await updateUserPreferences(user.uid, preferences, {
          email: user.email,
          displayName: user.displayName ?? profile?.displayName,
        });
        return null;
      } catch (error) {
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
