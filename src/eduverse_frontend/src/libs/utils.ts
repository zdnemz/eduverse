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
