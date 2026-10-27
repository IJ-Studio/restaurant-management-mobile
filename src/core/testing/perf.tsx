/**
 * Ayudas de las pruebas de rendimiento (Reassure). Cada pantalla se mide aislada: los casos de uso
 * responden al instante con datos fijos, así el tiempo medido es solo el de React al renderizar.
 */
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';
import { configure } from 'reassure';

import type { Dependencies } from '../di/dependencies';
import { AppProviders } from '../providers/AppProviders';
import { makeTestDependencies } from './makeTestDependencies';

// 30 mediciones (más 3 de calentamiento que se descartan) por escenario: con 10 el ruido del runner
// llega a ±25 % y un umbral de 10 % reprobaría al azar. No cabe en los 5 s por defecto de Jest.
configure({ runs: 30, warmupRuns: 3 });
jest.setTimeout(300_000);

/** Envoltorio con los providers de la app y navegación, como en producción. */
export function makeWrapper(overrides: Partial<Dependencies> = {}) {
  return function Wrapper({ children }: { children: ReactElement }) {
    // Caché nueva en cada corrida y sin timers de limpieza (gcTime Infinity): Jest termina limpio.
    const [queryClient] = useState(
      () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } }),
    );
    return (
      <AppProviders dependencies={makeTestDependencies(overrides)} queryClient={queryClient}>
        <NavigationContainer>{children}</NavigationContainer>
      </AppProviders>
    );
  };
}

/** Caso de uso que responde de inmediato con `value`. */
export const resolved = <T,>(value: T) => ({ execute: () => Promise.resolve(value) });
