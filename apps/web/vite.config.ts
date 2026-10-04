import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
  // Relative asset paths so the same build works on GitHub Pages (/NickStuApp/)
  // and inside Capacitor. Hash routing means no server rewrites are needed.
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    ...(process.env.SENTRY_AUTH_TOKEN
      ? [sentryVitePlugin({
          org: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          authToken: process.env.SENTRY_AUTH_TOKEN,
        })]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        // React + router change rarely, so they get their own long-cached chunk (and keep the
        // app chunk under Vite's 500 kB warning).
        manualChunks: {
          react: ['react', 'react-dom', 'react-dom/client', 'react-router'],
        },
      },
    },
  },
});
