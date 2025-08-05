import * as React from 'react';

export type DynamicRefs = Record<string, React.RefObject<HTMLElement | null>>;

export type RefContextType = {
  refs: DynamicRefs;
  registerRef: (key: string) => React.RefObject<HTMLElement | null>;
  scrollToRef: (key: string) => void;
  focusRef: (key: string) => void;
  getRef: (key: string) => React.RefObject<HTMLElement | null> | null;
};

export const RefContext = React.createContext<RefContextType | null>(null);

export function useRefContext() {
  const context = React.useContext(RefContext);
  if (!context) {
    throw new Error('useRefContext must be used within RefProvider');
  }
  return context;
}
