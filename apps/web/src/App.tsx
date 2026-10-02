import { RouterProvider } from 'react-router/dom';
import { router } from './router.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { useThemeSync } from './hooks/useTheme.js';

export function App() {
  useThemeSync();

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}
