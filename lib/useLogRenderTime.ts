'use client';

import { useRef, useCallback, useEffect, type DependencyList } from 'react';

/**
 * Call markRenderStart() right before setState with new data;
 * logs "[Render] <label> X ms" to console after the browser has painted.
 */
export function useLogRenderTime(label: string, deps: DependencyList) {
  const startRef = useRef<number | null>(null);

  const markRenderStart = useCallback(() => {
    startRef.current = typeof performance !== 'undefined' ? performance.now() : Date.now();
  }, []);

  useEffect(() => {
    if (startRef.current === null) return;
    const start = startRef.current;
    startRef.current = null;
    const log = () => {
      const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const ms = end - start;
      if (typeof console !== 'undefined' && console.info) {
        console.info(`[Render] ${label} → ${ms.toFixed(2)} ms (state update → paint)`);
      }
    };
    requestAnimationFrame(() => {
      requestAnimationFrame(log);
    });
  }, deps);

  return { markRenderStart };
}
