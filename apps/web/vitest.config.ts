import path from 'path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // Prefer ESM builds. Under the default `node` condition `react-router` resolves to
    // its CJS build while `react-router/dom` uses the ESM one, giving two Router
    // contexts (hooks then throw "may be used only in the context of a <Router>").
    conditions: ['module', 'browser', 'development|production'],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
  },
});
