"use client";

import { useSyncExternalStore } from "react";

let current = 0;

function subscribe(onChange: () => void) {
  current = Date.now();
  const id = window.setInterval(() => {
    current = Date.now();
    onChange();
  }, 1000);
  return () => window.clearInterval(id);
}

/** Ticks every second; returns 0 during SSR/hydration so server and client markup match. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, () => current, () => 0);
}
