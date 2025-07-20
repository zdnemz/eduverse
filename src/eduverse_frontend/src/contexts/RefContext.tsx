"use client";
import React, { createContext, useContext, useRef, RefObject } from "react";
import { scrollToRefHelper, focusRefHelper, getRefHelper } from "@/libs/refs";

type DynamicRefs = Record<string, RefObject<HTMLElement | null>>;

export type RefContextType = {
  refs: DynamicRefs;
  registerRef: (key: string) => RefObject<HTMLElement | null>;
  scrollToRef: (key: string) => void;
  focusRef: (key: string) => void;
  getRef: (key: string) => RefObject<HTMLElement | null> | null;
};

const RefContext = createContext<RefContextType | null>(null);

export function RefProvider({ children }: { children: React.ReactNode }) {
  const refs = useRef<DynamicRefs>({});

  function registerRef(key: string): RefObject<HTMLElement | null> {
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

export function useRefContext() {
  const context = useContext(RefContext);
  if (!context) {
    throw new Error("useRefContext must be used within RefProvider");
  }
  return context;
}
