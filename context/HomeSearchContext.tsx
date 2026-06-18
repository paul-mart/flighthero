import { createContext, useContext } from 'react';

const HomeSearchResetContext = createContext<(() => void) | null>(null);

export function useHomeSearchReset() {
  return useContext(HomeSearchResetContext);
}

export const HomeSearchResetProvider = HomeSearchResetContext.Provider;
