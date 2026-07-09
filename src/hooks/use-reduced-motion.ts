// ============================================================
// Reduced Motion Hook — Respects prefers-reduced-motion
// ============================================================

'use client';

import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const matches = mq.matches;
    const timer = setTimeout(() => setReduced(matches), 0);

    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => {
      clearTimeout(timer);
      mq.removeEventListener('change', handler);
    };
  }, []);

  return reduced;
}
