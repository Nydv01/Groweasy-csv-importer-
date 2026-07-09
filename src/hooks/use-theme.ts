// ============================================================
// Theme Hook — Dark/Light mode with system preference & persistence
// ============================================================

'use client';

import { useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const runSetup = () => {
      setMounted(true);
      const stored = localStorage.getItem('groweasy-theme') as Theme | null;
      if (stored) {
        setThemeState(stored);
        document.documentElement.setAttribute('data-theme', stored);
      } else {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initial = systemDark ? 'dark' : 'light';
        setThemeState(initial);
        document.documentElement.setAttribute('data-theme', initial);
      }
    };

    const timer = setTimeout(runSetup, 0);

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('groweasy-theme')) {
        const t = e.matches ? 'dark' : 'light';
        setThemeState(t);
        document.documentElement.setAttribute('data-theme', t);
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => {
      clearTimeout(timer);
      mediaQuery.removeEventListener('change', handler);
    };
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem('groweasy-theme', t);
    document.documentElement.setAttribute('data-theme', t);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme, mounted };
}
