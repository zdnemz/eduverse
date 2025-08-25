import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface LoadingStore {
  loadingKeys: Set<string>;
  hasHydrated: boolean;
  startLoading: (key: string) => void;
  stopLoading: (key: string) => void;
  setHasHydrated: () => void;
}

export const useLoadingStore = create<LoadingStore>()(
  subscribeWithSelector((set) => ({
    loadingKeys: new Set(),
    hasHydrated: false,

    setHasHydrated: () => set({ hasHydrated: true }),

    startLoading: (key) =>
      set((state) => {
        const newSet = new Set(state.loadingKeys);
        newSet.add(key);
        return { loadingKeys: newSet };
      }),

    stopLoading: (key) =>
      set((state) => {
        const newSet = new Set(state.loadingKeys);
        newSet.delete(key);
        return { loadingKeys: newSet };
      }),
  }))
);
