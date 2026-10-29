import { NavigationContainer } from '@react-navigation/native';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

import { AppError } from '../../../../core/errors/AppError';
import { makeTestDependencies } from '../../../../core/testing/makeTestDependencies';
import { renderWithProviders } from '../../../../core/testing/renderWithProviders';
import { makeSession } from '../../../auth/__fixtures__/auth';
import { makeMenu } from '../../../menu/__fixtures__/menu';
import { MenuNavigator } from '../../../menu/presentation/navigation/MenuNavigator';
import { makeOrderRepository } from '../../__fixtures__/orders';
import { ListTablesUseCase } from '../../domain/usecases/ListTablesUseCase';
import { SendOrderToKitchenUseCase } from '../../domain/usecases/SendOrderToKitchenUseCase';

function setup(repository = makeOrderRepository()) {
  const deps = makeTestDependencies({
    getMenuUseCase: { execute: jest.fn().mockResolvedValue(makeMenu()) },
    listTablesUseCase: new ListTablesUseCase(repository),
    sendOrderToKitchenUseCase: new SendOrderToKitchenUseCase(repository),
  });
  deps.sessionStore.getState().setSession(makeSession());
  return { deps, repository };
}

async function render(deps: ReturnType<typeof setup>['deps']) {
  await renderWithProviders(
    <NavigationContainer>
      <MenuNavigator />
    </NavigationContainer>,
    deps,
  );
}

async function addFromDetail(dishLabel: string, times = 1) {
  await fireEvent.press(await screen.findByRole('button', { name: dishLabel }));
  for (let i = 0; i < times; i++)
    await fireEvent.press(await screen.findByRole('button', { name: 'Agregar al pedido' }));
}

describe('Pedido de la mesa (mesero)', () => {
  it('arma el pedido desde el menú y lo manda a cocina', async () => {
    const { deps, repository } = setup();
    await render(deps);

    await addFromDetail('Enchiladas suizas, $145.50', 2);
    expect(screen.getByText('Agregado (2) · Agregar otro')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Pedido de la mesa, 2 platillos' }));

    expect(await screen.findByText('2 platillos · Total estimado')).toBeOnTheScreen();
    // Subtotal de la línea y total estimado.
    expect(screen.getAllByText('$291.00')).toHaveLength(2);

    await fireEvent.press(screen.getByRole('button', { name: 'Agregar uno de Enchiladas suizas' }));
    await fireEvent.press(await screen.findByRole('radio', { name: 'Mesa 5' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Enviar a cocina' }));

    expect(await screen.findByText(/Tu pedido fue enviado a cocina\./)).toBeOnTheScreen();
    expect(repository.createTableOrder).toHaveBeenCalledWith(
      7,
      '5',
      [{ dishId: 1, name: 'Enchiladas suizas', unitPrice: 145.5, quantity: 3 }],
      { guests: undefined, kitchenNote: undefined },
    );
    expect(repository.confirm).toHaveBeenCalledWith('orden-uuid');
    expect(deps.currentOrderStore.getState().order.lines).toEqual([]);
  });

  it('las mesas aparecen en orden y sin mesa no se envía', async () => {
    const { deps, repository } = setup();
    deps.currentOrderStore.getState().add({ dishId: 1, name: 'Enchiladas suizas', unitPrice: 145.5 });
    await render(deps);

    await fireEvent.press(await screen.findByRole('button', { name: 'Pedido de la mesa, 1 platillos' }));
    const tables = await screen.findAllByRole('radio');
    expect(tables.map((t) => t.props.accessibilityLabel)).toEqual(['Mesa 2', 'Mesa 5', 'Mesa 10']);

    await fireEvent.press(screen.getByRole('button', { name: 'Enviar a cocina' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Elige la mesa.');
    expect(repository.createTableOrder).not.toHaveBeenCalled();
  });

  it('quitar el último platillo deja el pedido vacío', async () => {
    const { deps } = setup();
    deps.currentOrderStore.getState().add({ dishId: 4, name: 'Café de olla', unitPrice: 45 });
    await render(deps);

    await fireEvent.press(await screen.findByRole('button', { name: 'Pedido de la mesa, 1 platillos' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Quitar uno de Café de olla' }));

    expect(await screen.findByText('Agrega platillos desde el menú.')).toBeOnTheScreen();
  });

  it('muestra los errores del API y conserva el pedido', async () => {
    const repository = makeOrderRepository();
    repository.createTableOrder.mockRejectedValue(
      new AppError('validation', 'La mesa número 5 no está disponible actualmente.'),
    );
    const { deps } = setup(repository);
    deps.currentOrderStore.getState().add({ dishId: 4, name: 'Café de olla', unitPrice: 45 });
    deps.currentOrderStore.getState().setTable('5');
    await render(deps);

    await fireEvent.press(await screen.findByRole('button', { name: 'Pedido de la mesa, 1 platillos' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Enviar a cocina' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La mesa número 5 no está disponible actualmente.',
    );
    expect(deps.currentOrderStore.getState().order.lines).toHaveLength(1);
  });

  it('no se puede agregar un platillo agotado y avisa si fallan las mesas', async () => {
    const repository = makeOrderRepository();
    repository.listTables.mockRejectedValue(new AppError('network', 'No hay conexión con el servidor.'));
    const { deps } = setup(repository);
    await render(deps);

    await fireEvent.press(await screen.findByRole('button', { name: 'Mole poblano, Agotado, $145.50' }));
    expect(await screen.findByRole('button', { name: 'Agregar al pedido' })).toBeDisabled();

    await act(() =>
      deps.currentOrderStore.getState().add({ dishId: 1, name: 'Enchiladas suizas', unitPrice: 145.5 }),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Pedido de la mesa, 1 platillos' }));
    await waitFor(() => expect(screen.getByText('No hay conexión con el servidor.')).toBeOnTheScreen());
  });
});
