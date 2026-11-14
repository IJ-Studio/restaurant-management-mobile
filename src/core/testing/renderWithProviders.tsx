import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import type { Dependencies } from '../di/dependencies';
import { AppProviders } from '../providers/AppProviders';

/** Renderiza con los providers de la app, mocks inyectados y una caché de React Query nueva. */
export async function renderWithProviders(
  ui: ReactElement,
  dependencies: Dependencies,
  // gcTime Infinity: sin timers de limpieza de caché que dejen a Jest esperando al terminar.
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  }),
) {
  const result = await render(
    <AppProviders dependencies={dependencies} queryClient={queryClient}>
      {ui}
    </AppProviders>,
  );
  return { ...result, queryClient };
}
