import { vi, describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('@/lib/supabase.js', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
}));

vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
  captureException: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn().mockReturnValue(false),
  },
}));

import { App } from '../App.js';

describe('App', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });
});
