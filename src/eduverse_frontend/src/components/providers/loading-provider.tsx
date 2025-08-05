import { useLoadingStore } from '@/stores/loading-store';
import Loading from '../Loading';
import { useEffect } from 'react';
import { lockScroll, unlockScroll } from '@/lib/scroll';

interface LoadingProviderProps {
  children: React.ReactNode;
}

export default function LoadingProvider({ children }: LoadingProviderProps) {
  const isLoading = useLoadingStore((state) => state.loadingKeys.size > 0);
  const hasHydrated = useLoadingStore((state) => state.hasHydrated);
  const setHasHydrated = useLoadingStore((state) => state.setHasHydrated);

  useEffect(() => {
    setHasHydrated();
  }, [setHasHydrated]);

  useEffect(() => {
    if (hasHydrated) {
      if (isLoading) {
        lockScroll();
      } else {
        unlockScroll();
      }
    }
  }, [hasHydrated, isLoading]);

  return (
    <>
      {(!hasHydrated || isLoading) && <Loading />}
      {children}
    </>
  );
}
