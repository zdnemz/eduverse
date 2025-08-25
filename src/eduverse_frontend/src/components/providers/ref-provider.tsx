import * as React from 'react';

import { DynamicRefs, RefContext } from '@/contexts/RefContext';
import { scrollToRefHelper, focusRefHelper, getRefHelper } from '@/lib/refs';

export function RefProvider({ children }: { children: React.ReactNode }) {
  const refs = React.useRef<DynamicRefs>({});

  function registerRef(key: string): React.RefObject<HTMLElement | null> {
    if (!refs.current[key]) {
      refs.current[key] = React.createRef<HTMLElement>();
    }
    return refs.current[key];
  }

  return (
    <RefContext.Provider
      value={{
        refs: refs.current,
        registerRef,
        scrollToRef: (key) => scrollToRefHelper(refs.current, key),
        focusRef: (key) => focusRefHelper(refs.current, key),
        getRef: (key) => getRefHelper(refs.current, key),
      }}
    >
      {children}
    </RefContext.Provider>
  );
}
