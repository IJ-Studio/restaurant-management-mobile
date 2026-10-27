import { fireEvent, screen } from '@testing-library/react-native';

import { AuthGate } from '../../features/auth/presentation/components/AuthGate';
import { createDependencies } from '../di/dependencies';
import { AppNavigator } from '../navigation/AppNavigator';
import { TEST_PASSWORD } from './data/testData';
import { createFakeApi, createMemorySessionStorage } from './fakeApi';
import { renderWithProviders } from './renderWithProviders';

/**
 * Arranca la app completa (AuthGate + navegación por rol) con el grafo de dependencias real,
 * conectado al API falso con los datos de prueba. Solo se sustituyen la red y el almacenamiento seguro.
 */
export async function startTestApp() {
  const api = createFakeApi();
  const storage = createMemorySessionStorage();
  const deps = createDependencies({ httpClient: api.httpClient, sessionStorage: storage });
  await renderWithProviders(
    <AuthGate>
      <AppNavigator />
    </AuthGate>,
    deps,
  );
  return { api, storage, deps };
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
