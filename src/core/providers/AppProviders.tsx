import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import { DependenciesProvider } from '../di/DependenciesProvider';
import type { Dependencies } from '../di/dependencies';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: 1, staleTime: 30_000 },
      mutations: { retry: 0 },
    },
  });
}

interface Props {
  children: ReactNode;
  dependencies?: Dependencies;
  queryClient?: QueryClient;
}

/** Providers globales: inyección de dependencias + caché de datos del servidor. */
export function AppProviders({ children, dependencies, queryClient }: Props) {
  const [client] = useState(() => queryClient ?? createQueryClient());
  return (
    <QueryClientProvider client={client}>
      <DependenciesProvider value={dependencies}>{children}</DependenciesProvider>
    </QueryClientProvider>
  );
}
