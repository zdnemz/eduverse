import { RefObject } from 'react';

type DynamicRefs = Record<string, RefObject<HTMLElement | null>>;

export function scrollToRefHelper(refs: DynamicRefs, key: string) {
  refs[key]?.current?.scrollIntoView({ behavior: 'smooth' });
}

export function focusRefHelper(refs: DynamicRefs, key: string) {
  refs[key]?.current?.focus();
}

export function getRefHelper(refs: DynamicRefs, key: string) {
  return refs[key] || null;
}
