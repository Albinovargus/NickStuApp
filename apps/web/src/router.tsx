import { createHashRouter } from 'react-router';
import { PublicShell } from './components/layout/PublicShell.js';
import { ModulesHomePage } from './pages/ModulesHomePage.js';
import { CardSortPage } from './pages/CardSortPage.js';
import { MemoryMatchPage } from './pages/MemoryMatchPage.js';

// Auth routes are lazy-loaded so the public modules never import Supabase
// (lib/supabase.ts throws at import time when its env vars are missing).
export const router = createHashRouter([
  {
    path: '/',
    element: <PublicShell />,
    children: [
      { index: true, element: <ModulesHomePage /> },
      { path: 'modules/card-sort', element: <CardSortPage /> },
      { path: 'modules/memory-match', element: <MemoryMatchPage /> },
    ],
  },
  {
    path: '/login',
    lazy: async () => ({ Component: (await import('./pages/LoginPage.js')).LoginPage }),
  },
  {
    path: '/dashboard',
    lazy: async () => ({ Component: (await import('./components/layout/AppShell.js')).AppShell }),
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import('./pages/DashboardPage.js')).DashboardPage }),
      },
    ],
  },
]);
