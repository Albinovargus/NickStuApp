import { create } from 'zustand';

export type Theme = 'light' | 'dark';

// Also read by the inline script in index.html, which applies the theme before first paint.
export const THEME_STORAGE_KEY = 'theme';

function readStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null; // storage blocked (private mode etc.) — fall back to the system theme
  }
}

export function systemTheme(): Theme {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

interface ThemeState {
  theme: Theme;
  /** True once the user has toggled; from then on the system setting is ignored. */
  hasChoice: boolean;
  toggle: () => void;
  /** Follow a system theme change, unless the user has made a choice. */
  syncSystem: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()((set, get) => {
  const stored = readStoredTheme();
  return {
    theme: stored ?? systemTheme(),
    hasChoice: stored !== null,
    toggle: () => {
      const theme: Theme = get().theme === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch {
        // Not persisted, but still applied for this visit.
      }
      set({ theme, hasChoice: true });
    },
    syncSystem: (theme) => {
      if (!get().hasChoice) set({ theme });
    },
  };
});
