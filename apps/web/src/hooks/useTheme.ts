import { useEffect } from 'react';
import { useThemeStore } from '../store/theme.store.js';

/** Applies the current theme to <html> and follows system changes. Mount once, at the app root. */
export function useThemeSync() {
  const theme = useThemeStore((s) => s.theme);
  const syncSystem = useThemeStore((s) => s.syncSystem);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!query) return;
    const onChange = (e: MediaQueryListEvent) => syncSystem(e.matches ? 'dark' : 'light');
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [syncSystem]);
}
