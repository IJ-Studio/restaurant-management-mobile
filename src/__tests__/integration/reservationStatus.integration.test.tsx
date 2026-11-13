/**
 * Integración (paridad con la web): el administrador cambia el estado de una reservación y la cancela
 * con motivo; el mesero no ve esa acción.
 */
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { testUsers } from '../../core/testing/data/testData';
import { loginAs, startTestApp, tab } from '../../core/testing/startTestApp';

async function openReservationsAs(email: string) {
  const app = await startTestApp();
  await loginAs(email);
  await waitFor(() => expect(tab('Reservaciones')).toBeOnTheScreen());
  await fireEvent.press(tab('Reservaciones')!);
  return app;
}

describe('Integración: estado de las reservaciones', () => {
  it('el administrador cancela una reservación con motivo y el listado la refleja', async () => {
    const { api } = await openReservationsAs(testUsers.admin.email);
    const [first] = await screen.findAllByRole('button', { name: /^Cambiar estado de / });
    const target = api.reservations.find((r) => first.props.accessibilityLabel.endsWith(r.clienteNombre))!;
    await fireEvent.press(first);

    await fireEvent.press(await screen.findByRole('radio', { name: 'Cancelada' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar estado' }));
    expect(await screen.findByText('Escribe el motivo de la cancelación.')).toBeOnTheScreen();

    await fireEvent.changeText(
      screen.getByLabelText('Motivo de la cancelación'),
      'El cliente llamó para cancelar',
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar estado' }));

    expect(await screen.findByText('Estado guardado: Cancelada')).toBeOnTheScreen();
    const patch = api.requests.find((r) => r.method === 'PATCH' && r.path === `reservations/${target.id}`);
    expect(patch?.body).toEqual({
      estatus: 'cancelada',
      motivoCancelacion: 'El cliente llamó para cancelar',
    });
  });

  it('el mesero no ve «Cambiar estado»', async () => {
    await openReservationsAs(testUsers.mesero.email);
    await screen.findAllByText(/personas? ·/);

    expect(screen.queryByRole('button', { name: /^Cambiar estado de / })).toBeNull();
  });
});
