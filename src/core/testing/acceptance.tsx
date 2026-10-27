/**
 * Ayudas para las pruebas de aceptación (src/__tests__/acceptance).
 *
 * Una prueba de aceptación recorre la app completa como lo haría la persona de cada rol: abre la app,
 * inicia sesión, toca pestañas y botones, y revisa lo que ve en pantalla. Usa `startTestApp` (grafo de
 * dependencias real + API falso con los datos de prueba); no hay red ni mocks de casos de uso.
 */
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { testUsers } from './data/testData';
import { loginAs, tab } from './startTestApp';

// El selector nativo de fecha no existe en Jest: se reemplaza por un input donde la prueba escribe la fecha.
jest.mock('@react-native-community/datetimepicker', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { TextInput } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    __esModule: true,
    default: ({ mode, onChange }: { mode: string; onChange: (e: { type: string }, d?: Date) => void }) =>
      React.createElement(TextInput, {
        testID: `picker-${mode}`,
        onChangeText: (text: string) =>
          onChange({ type: text ? 'set' : 'dismissed' }, text ? new Date(text) : undefined),
      }),
  };
});

export type StaffRole = keyof typeof testUsers;

/** Primera pestaña que ve cada rol al entrar (SECTIONS_BY_ROLE). */
export const FIRST_TAB: Record<StaffRole, string> = {
  admin: 'Dashboard',
  mesero: 'Menú',
  cajero: 'Cobros',
  cocina: 'Pedidos',
};

/** Inicia sesión con el usuario de prueba del rol y espera a que aparezca su primera pestaña. */
export async function signInAs(role: StaffRole) {
  await loginAs(testUsers[role].email);
  await waitFor(() => expect(tab(FIRST_TAB[role])).toBeOnTheScreen());
}

export async function openTab(title: string) {
  await waitFor(() => expect(tab(title)).toBeOnTheScreen());
  await fireEvent.press(tab(title)!);
}

const TAB_TITLES = ['Dashboard', 'Menú', 'Pedidos', 'Reservaciones', 'Cobros', 'Perfil'];

/** Títulos de las pestañas de la barra inferior, en el orden en que se ven. */
export function visibleTabs(): string[] {
  return screen
    .queryAllByRole('button')
    .map((node) => String(node.props.accessibilityLabel ?? '').split(',')[0])
    .filter((title) => TAB_TITLES.includes(title));
}

/** URLs de todas las imágenes que se están mostrando. */
export function imageUris(): string[] {
  const uris: string[] = [];
  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(visit);
    const { type, props, children } = node as {
      type?: string;
      props?: { source?: { uri?: string } };
      children?: unknown;
    };
    if (type === 'Image' && props?.source?.uri) uris.push(props.source.uri);
    visit(children);
  };
  visit(screen.toJSON());
  return uris;
}

export function tomorrowAt(hours: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(hours, 0, 0, 0);
  return date;
}

/** Elige fecha y hora en el formulario de reservación. */
export async function pickDateTime(date: Date) {
  await fireEvent.press(screen.getByRole('button', { name: 'Elegir fecha' }));
  await fireEvent.changeText(screen.getByTestId('picker-date'), date.toISOString());
  await fireEvent.press(screen.getByRole('button', { name: /^(Hora|Elegir hora)/ }));
  await fireEvent.changeText(screen.getByTestId('picker-time'), date.toISOString());
}
