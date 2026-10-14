import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import type { Dependencies } from '../di/dependencies';
import { AppProviders } from '../providers/AppProviders';

/** Renderiza con los providers de la app, mocks inyectados y una caché de React Query nueva. */
export function renderWithProviders(ui: ReactElement, dependencies: Dependencies) {
  const queryClient = new QueryClient({
    // gcTime Infinity: sin timers de limpieza de caché que dejen a Jest esperando al terminar.
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  return render(
    <AppProviders dependencies={dependencies} queryClient={queryClient}>
      {ui}
    </AppProviders>,
  );
}
