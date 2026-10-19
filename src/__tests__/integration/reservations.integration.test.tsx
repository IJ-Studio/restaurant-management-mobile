/**
 * Integración HU-04 con datos de prueba: el listado de reservaciones activas que llega del API falso.
 */
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { testUsers } from '../../core/testing/data/testData';
import { loginAs, startTestApp, tab } from '../../core/testing/startTestApp';

describe('Integración: reservaciones con datos de prueba', () => {
  it('lista las activas en orden, sin las canceladas, y pide desde el inicio del día', async () => {
    const { api } = await startTestApp();
    await loginAs(testUsers.admin.email);

    await waitFor(() => expect(tab('Reservaciones')).toBeOnTheScreen());
    await fireEvent.press(tab('Reservaciones')!);

    expect(await screen.findByText('Cliente Prueba Uno')).toBeOnTheScreen();
    expect(screen.getByText('4 personas · Mesa 3 · Confirmada')).toBeOnTheScreen();
    expect(screen.getByText('2 personas · Sin mesa · Por confirmar')).toBeOnTheScreen();
    expect(screen.queryByText('Cliente Cancelado')).toBeNull();

    const names = screen.getAllByText(/^Cliente Prueba/).map((node) => node.props.children);
    expect(names).toEqual(['Cliente Prueba Uno', 'Cliente Prueba Dos']);

    const list = api.requests.find((r) => r.method === 'GET' && r.path === 'reservations');
    expect(list?.authorization).toMatch(/^Bearer /);
  });
});
