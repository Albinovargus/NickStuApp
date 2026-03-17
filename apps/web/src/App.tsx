import { RouterProvider } from 'react-router/dom';
import { router } from './router.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';

export function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}
