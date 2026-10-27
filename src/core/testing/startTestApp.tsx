import { fireEvent, screen } from '@testing-library/react-native';

import { AuthGate } from '../../features/auth/presentation/components/AuthGate';
import { createDependencies } from '../di/dependencies';
import { AppNavigator } from '../navigation/AppNavigator';
import { TEST_PASSWORD } from './data/testData';
import { createFakeApi, createMemorySessionStorage } from './fakeApi';
import { renderWithProviders } from './renderWithProviders';

interface StartOptions {
  /** API ya creado: simula que el servidor sigue vivo entre dos aperturas de la app. */
  api?: ReturnType<typeof createFakeApi>;
  /** Almacenamiento ya usado: simula cerrar y volver a abrir la app en el mismo celular. */
  storage?: ReturnType<typeof createMemorySessionStorage>;
}

/**
 * Arranca la app completa (AuthGate + navegación por rol) con el grafo de dependencias real,
 * conectado al API falso con los datos de prueba. Solo se sustituyen la red y el almacenamiento seguro.
 */
export async function startTestApp({
  api = createFakeApi(),
  storage = createMemorySessionStorage(),
}: StartOptions = {}) {
  const deps = createDependencies({ httpClient: api.httpClient, sessionStorage: storage });
  const view = await renderWithProviders(
    <AuthGate>
      <AppNavigator />
    </AuthGate>,
    deps,
  );
  return { api, storage, deps, unmount: view.unmount };
}

/** Llena el formulario de Login y lo envía. */
export async function loginAs(email: string, password: string = TEST_PASSWORD) {
  await fireEvent.changeText(await screen.findByLabelText('Correo'), email);
  await fireEvent.changeText(screen.getByLabelText('Contraseña'), password);
  await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
}

/** Pestaña de la barra inferior por su título. */
export const tab = (title: string) =>
  screen
    .queryAllByRole('button')
    .find((node) => String(node.props.accessibilityLabel ?? '').startsWith(`${title},`)) ?? null;
