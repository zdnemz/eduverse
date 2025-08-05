import { useCallback, useEffect } from 'react';
import { useLoadingStore } from '@/stores/loading-store';

export const useLoading = (key: string) => {
  const startLoading = useCallback(() => {
    useLoadingStore.getState().startLoading(key);
  }, [key]);

  const stopLoading = useCallback(() => {
    useLoadingStore.getState().stopLoading(key);
  }, [key]);

  useEffect(() => {
    return () => {
      useLoadingStore.getState().stopLoading(key);
    };
  }, [key]);

  return { startLoading, stopLoading };
};
