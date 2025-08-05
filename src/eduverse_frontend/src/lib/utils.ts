import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}

export function formatPrincipal(principal: string) {
  if (principal.length <= 15) return principal;
  const parts = principal.split('-');
  return `${parts.slice(0, 2).join('-')} ... ${parts.slice(-2).join('-')}`;
}

export async function retry<T>(callback: () => Promise<T>, maxRetries: number = 3): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < maxRetries; i++) {
    try {
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * i));
      }

      return await callback();
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed:`, error);
      lastError = error;
    }
  }

  throw lastError;
}
