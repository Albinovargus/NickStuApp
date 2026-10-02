import { describe, it, expect, beforeEach, vi } from 'vitest';

// The store reads localStorage/matchMedia when created, so each test imports a fresh copy.
async function freshStore(systemDark: boolean) {
  vi.resetModules();
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: systemDark, media: query }));
  return (await import('../store/theme.store.js')).useThemeStore;
}

describe('theme store', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('starts from the system theme when nothing is saved', async () => {
    expect((await freshStore(true)).getState().theme).toBe('dark');
    expect((await freshStore(false)).getState().theme).toBe('light');
  });

  it('a saved choice wins over the system theme', async () => {
    localStorage.setItem('theme', 'light');
    const store = await freshStore(true);
    expect(store.getState()).toMatchObject({ theme: 'light', hasChoice: true });
  });

  it('ignores an invalid saved value', async () => {
    localStorage.setItem('theme', 'purple');
    expect((await freshStore(true)).getState().theme).toBe('dark');
  });

  it('toggle switches and persists the choice', async () => {
    const store = await freshStore(false);
    store.getState().toggle();
    expect(store.getState()).toMatchObject({ theme: 'dark', hasChoice: true });
    expect(localStorage.getItem('theme')).toBe('dark');
    store.getState().toggle();
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('follows system changes only until the user makes a choice', async () => {
    const store = await freshStore(false);
    store.getState().syncSystem('dark');
    expect(store.getState().theme).toBe('dark');

    store.getState().toggle(); // -> light, now a choice
    store.getState().syncSystem('dark');
    expect(store.getState().theme).toBe('light');
  });
});
