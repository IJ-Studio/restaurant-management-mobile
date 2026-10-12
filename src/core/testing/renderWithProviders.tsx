import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import type { Dependencies } from '../di/dependencies';
import { AppProviders } from '../providers/AppProviders';

/** Renderiza con los providers de la app, mocks inyectados y una caché de React Query nueva. */
export function renderWithProviders(ui: ReactElement, dependencies: Dependencies) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <AppProviders dependencies={dependencies} queryClient={queryClient}>
      {ui}
    </AppProviders>,
  );
}
