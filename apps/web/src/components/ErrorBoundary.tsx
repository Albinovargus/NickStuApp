import * as Sentry from '@sentry/react';
import type { ReactNode } from 'react';

function ErrorFallback() {
  return (
    <div className="flex h-[100dvh] items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">
          Please try refreshing the page.
        </p>
        <button
          className="mt-4 min-h-11 rounded-md bg-primary px-4 py-2 text-primary-foreground"
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

export function ErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      {children}
    </Sentry.ErrorBoundary>
  );
}
