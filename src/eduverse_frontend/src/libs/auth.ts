import { Identity } from '@dfinity/agent';
import { createBackendActor } from '@/libs/actor';

export const createActorWithRetry = async (identity: Identity, maxRetries = 3) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * i));
      }

      const actor = await createBackendActor(identity);
      return actor;
    } catch (error) {
      console.warn(`Actor creation attempt ${i + 1} failed:`, error);
      lastError = error;
    }
  }

  throw lastError;
};

export const callWithRetry = async <T>(
  actorCall: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      if (i > 0) {
        console.log(`Retrying call, attempt ${i + 1}/${maxRetries}`);
        await new Promise((resolve) => setTimeout(resolve, delayMs * i));
      }

      const result = await actorCall();
      return result;
    } catch (error) {
      console.warn(`Call attempt ${i + 1} failed:`, error);
      lastError = error;

      if (!(error as Error).message?.includes('Invalid signature')) {
        throw error;
      }
    }
  }

  throw lastError;
};

export const isIdentityValid = (identity: Identity | null, principal?: string | any): boolean => {
  if (!identity) return false;

  try {
    const identityPrincipal = identity.getPrincipal();

    if (typeof principal === 'string') {
      return principal !== '2vxsx-fae' && principal.length > 0;
    }

    if (principal && typeof principal.isAnonymous === 'function') {
      return !principal.isAnonymous();
    }

    return !identityPrincipal.isAnonymous();
  } catch {
    return false;
  }
};

export const handleAuthError = (error: any): string => {
  if (error.message?.includes('Invalid signature')) {
    return 'Authentication error. Please refresh the page and try logging in again.';
  }

  if (error.message?.includes('Could not verify')) {
    return 'Authentication verification failed. Please check your connection and try again.';
  }

  if (error.message?.includes('anonymous')) {
    return 'Please log in to continue.';
  }

  return 'An unexpected error occurred. Please try again.';
};
