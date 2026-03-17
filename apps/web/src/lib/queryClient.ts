import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import * as Sentry from '@sentry/react';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => Sentry.captureException(error),
  }),
  mutationCache: new MutationCache({
    onError: (error) => Sentry.captureException(error),
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});
