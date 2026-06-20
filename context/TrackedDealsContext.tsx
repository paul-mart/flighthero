import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import {
  isTrackedDealSaved,
  migrateLocalTrackedDealsToCloud,
  removeTrackedDeal,
  saveTrackedDeal,
  subscribeTrackedDeals,
  type TrackedDeal,
  type TrackedDealInput,
} from '../lib/trackedDeals';

interface TrackedDealsContextValue {
  deals: TrackedDeal[];
  loading: boolean;
  saveDeal: (input: TrackedDealInput) => Promise<string | null>;
  removeDeal: (dealId: string) => Promise<void>;
  isTracked: (input: TrackedDealInput) => boolean;
}

const TrackedDealsContext = createContext<TrackedDealsContextValue | null>(null);

export function TrackedDealsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [deals, setDeals] = useState<TrackedDeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setDeals([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    let cancelled = false;

    migrateLocalTrackedDealsToCloud(user.uid).catch(() => undefined);

    const unsubscribe = subscribeTrackedDeals(
      user.uid,
      (nextDeals) => {
        if (cancelled) return;
        setDeals(nextDeals);
        setLoading(false);
      },
      () => {
        if (cancelled) return;
        setLoading(false);
      },
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [user?.uid]);

  const saveDeal = useCallback(async (input: TrackedDealInput) => {
    if (!user) {
      throw new Error('Sign in to track award deals.');
    }
    const result = await saveTrackedDeal(user.uid, input);
    setDeals((current) => {
      const withoutDuplicate = current.filter((deal) => deal.id !== result.deal.id);
      return [result.deal, ...withoutDuplicate].slice(0, 20);
    });
    return result.error ?? null;
  }, [user]);

  const removeDeal = useCallback(async (dealId: string) => {
    if (!user) return;
    await removeTrackedDeal(user.uid, dealId);
    setDeals((current) => current.filter((deal) => deal.id !== dealId));
  }, [user]);

  const isTracked = useCallback(
    (input: TrackedDealInput) => isTrackedDealSaved(deals, input),
    [deals],
  );

  const value = useMemo<TrackedDealsContextValue>(() => ({
    deals,
    loading,
    saveDeal,
    removeDeal,
    isTracked,
  }), [deals, loading, saveDeal, removeDeal, isTracked]);

  return (
    <TrackedDealsContext.Provider value={value}>
      {children}
    </TrackedDealsContext.Provider>
  );
}

export function useTrackedDeals(): TrackedDealsContextValue {
  const context = useContext(TrackedDealsContext);
  if (!context) {
    throw new Error('useTrackedDeals must be used within a TrackedDealsProvider');
  }
  return context;
}
