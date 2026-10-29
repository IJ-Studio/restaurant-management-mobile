import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import { Alert, type AlertButton } from 'react-native';

import { AppError } from '../../../../core/errors/AppError';
import type { Dependencies } from '../../../../core/di/dependencies';
import { makeTestDependencies } from '../../../../core/testing/makeTestDependencies';
import { renderWithProviders } from '../../../../core/testing/renderWithProviders';
import { makeSession } from '../../../auth/__fixtures__/auth';
import type { Role } from '../../../auth/domain/entities/Role';
import { makeActiveOrder, makeOrderDetail } from '../../__fixtures__/orders';
import { OrdersNavigator } from '../navigation/OrdersNavigator';

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60000).toISOString();

const ORDERS = [
  makeActiveOrder({
    id: 'a',
    place: 'Mesa 5',
    status: 'abierta',
    customer: 'Ana López',
    openedAt: minutesAgo(5),
  }),
  makeActiveOrder({ id: 'b', place: 'Mesa 2', status: 'pendiente', customer: 'Luis Gil' }),
  makeActiveOrder({
    id: 'c',
    place: 'Mesa 7',
    status: 'lista',
    customer: 'Eva Sol',
    openedAt: minutesAgo(30),
  }),
  makeActiveOrder({
    id: 'd',
    place: 'Mesa 9',
    status: 'en_preparacion',
    customer: 'Raúl Paz',
    openedAt: minutesAgo(25),
  }),
  makeActiveOrder({
    id: 'e',
    place: 'Domicilio',
    tableNumber: undefined,
    status: 'entregada',
    customer: 'Gil',
  }),
];

function setup(role: Role = 'mesero', overrides: Partial<Dependencies> = {}) {
  const deps = makeTestDependencies({
    listActiveOrdersUseCase: { execute: jest.fn().mockResolvedValue(ORDERS) },
    getOrderDetailUseCase: { execute: jest.fn().mockResolvedValue(makeOrderDetail()) },
    updateOrderStatusUseCase: { execute: jest.fn().mockResolvedValue('Pedido actualizado.') },
    ...overrides,
  });
  const session = makeSession();
  session.user.role = role;
  deps.sessionStore.getState().setSession(session);
  return deps;
}

function renderOrders(deps: Dependencies) {
  return renderWithProviders(
    <NavigationContainer>
      <OrdersNavigator />
    </NavigationContainer>,
    deps,
  );
}

const cardLabel = (place: string, status: string, customer: string) =>
  `${place}, ${status}, ${customer}, $336.00`;

async function openOrder(deps: Dependencies) {
  await renderOrders(deps);
  await fireEvent.press(
    await screen.findByRole('button', { name: cardLabel('Mesa 5', 'En cocina', 'Ana López') }),
  );
}

describe('Pedidos: lista del piso', () => {
  it('filtra por el recorrido del pedido', async () => {
    await renderOrders(setup());

    expect(await screen.findByRole('radio', { name: 'Todos · 5' })).toBeSelected();
    await fireEvent.press(screen.getByRole('radio', { name: 'En cocina · 2' }));
    expect(screen.getByText('Mesa 5')).toBeOnTheScreen();
    expect(screen.getByText('Mesa 9')).toBeOnTheScreen();
    expect(screen.queryByText('Mesa 2')).toBeNull();

    await fireEvent.press(screen.getByRole('radio', { name: 'Por cobrar · 1' }));
    expect(screen.getByText('Domicilio')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('radio', { name: 'Por confirmar · 1' }));
    expect(screen.getByText('Mesa 2')).toBeOnTheScreen();
  });

  it('el mesero entrega con un toque lo que cocina dejó listo', async () => {
    const deps = setup();
    await renderOrders(deps);

    await fireEvent.press(await screen.findByRole('button', { name: 'Entregar en la mesa: Mesa 7' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Pedido actualizado.');
    expect(deps.updateOrderStatusUseCase.execute).toHaveBeenCalledWith('c', 'entregada');
    await waitFor(() => expect(deps.listActiveOrdersUseCase.execute).toHaveBeenCalledTimes(2));
    // Al mesero no se le ofrecen los pasos de cocina.
    expect(screen.queryByRole('button', { name: /^Empezar a preparar/ })).toBeNull();
  });

  it('muestra el motivo cuando el paso falla', async () => {
    const deps = setup('mesero', {
      updateOrderStatusUseCase: {
        execute: jest.fn().mockRejectedValue(new AppError('validation', 'El pedido cambió mientras tanto.')),
      },
    });
    await renderOrders(deps);

    await fireEvent.press(await screen.findByRole('button', { name: 'Entregar en la mesa: Mesa 7' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('El pedido cambió mientras tanto.');
  });

  it('si falla la consulta muestra el error y permite reintentar', async () => {
    const execute = jest
      .fn()
      .mockRejectedValueOnce(new AppError('network', 'No hay conexión con el servidor.'))
      .mockResolvedValue([]);
    await renderOrders(setup('admin', { listActiveOrdersUseCase: { execute } }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No hay conexión con el servidor.');
    await fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('No hay pedidos en este filtro.')).toBeOnTheScreen();
  });
});

describe('Pedidos: vista de cocina', () => {
  it('muestra su cola del más antiguo al más nuevo, con platillos y demoras', async () => {
    await renderOrders(setup('cocina'));

    expect(await screen.findByRole('radio', { name: 'Todos · 3' })).toBeSelected();
    const places = screen.getAllByText(/^Mesa \d$/).map((node) => node.props.children);
    expect(places).toEqual(['Mesa 7', 'Mesa 9', 'Mesa 5']);
    expect(screen.queryByText('Mesa 2')).toBeNull();
    expect(screen.getAllByText('1× Café de olla')).toHaveLength(3);
    expect(screen.getByText('hace 30 min')).toBeOnTheScreen();
  });

  it('empieza y termina pedidos con un toque', async () => {
    const deps = setup('cocina');
    await renderOrders(deps);

    await fireEvent.press(await screen.findByRole('button', { name: 'Empezar a preparar: Mesa 5' }));
    await waitFor(() =>
      expect(deps.updateOrderStatusUseCase.execute).toHaveBeenCalledWith('a', 'en_preparacion'),
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Marcar como lista: Mesa 9' }));
    await waitFor(() => expect(deps.updateOrderStatusUseCase.execute).toHaveBeenCalledWith('d', 'lista'));
  });

  it('avisa cuando no hay nada pendiente', async () => {
    await renderOrders(
      setup('cocina', { listActiveOrdersUseCase: { execute: jest.fn().mockResolvedValue([]) } }),
    );
    expect(await screen.findByText('No hay pedidos en cocina. ¡Todo al día!')).toBeOnTheScreen();
  });
});

describe('Pedidos: detalle', () => {
  it('muestra los platillos y manda a cocina un pedido pendiente', async () => {
    const confirm = jest.fn().mockResolvedValue({ orderId: 'a', message: 'Tu pedido fue enviado a cocina.' });
    const deps = setup('mesero', { confirmOrderUseCase: { execute: confirm } });
    await openOrder(deps);

    expect(await screen.findByText('Enchiladas suizas')).toBeOnTheScreen();
    expect(screen.getByText('$291.00')).toBeOnTheScreen();
    expect(deps.getOrderDetailUseCase.execute).toHaveBeenCalledWith('a');

    await fireEvent.press(screen.getByRole('button', { name: 'Confirmar y enviar a cocina' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Tu pedido fue enviado a cocina.');
    expect(confirm).toHaveBeenCalledWith('a');
    await waitFor(() => expect(deps.listActiveOrdersUseCase.execute).toHaveBeenCalledTimes(2));
  });

  it('quita un platillo de un pedido pendiente', async () => {
    const remove = jest.fn().mockResolvedValue('Producto eliminado de tu pedido.');
    await openOrder(setup('cajero', { removeOrderItemUseCase: { execute: remove } }));

    await fireEvent.press(await screen.findByRole('button', { name: 'Quitar Café de olla' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Producto eliminado de tu pedido.');
    expect(remove).toHaveBeenCalledWith(102);
  });

  it('cancela un pedido recién enviado después de confirmarlo en el aviso', async () => {
    const cancel = jest.fn().mockResolvedValue('Tu comanda ha sido cancelada con éxito.');
    const alert = jest
      .spyOn(Alert, 'alert')
      .mockImplementation((_title, _message, buttons?: AlertButton[]) => buttons?.[1]?.onPress?.());
    await openOrder(
      setup('mesero', {
        getOrderDetailUseCase: {
          execute: jest
            .fn()
            .mockResolvedValue(makeOrderDetail({ status: 'abierta', openedAt: new Date().toISOString() })),
        },
        cancelOrderUseCase: { execute: cancel },
      }),
    );

    expect(await screen.findByText(/primeros 2 minutos/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Cancelar pedido' }));

    expect(alert).toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent('Tu comanda ha sido cancelada con éxito.');
    expect(cancel).toHaveBeenCalledWith('a');
    alert.mockRestore();
  });

  it('cocina ve las notas y avanza el pedido desde el detalle', async () => {
    const deps = setup('cocina', {
      getOrderDetailUseCase: {
        execute: jest.fn().mockResolvedValue(
          makeOrderDetail({
            status: 'en_preparacion',
            kitchenNotes: 'Alergia a la nuez',
            items: [{ id: 101, name: 'Mole', quantity: 1, unitPrice: 180, notes: 'Sin ajonjolí' }],
          }),
        ),
      },
    });
    await renderOrders(deps);
    await fireEvent.press(
      await screen.findByRole('button', { name: cardLabel('Mesa 9', 'Preparando', 'Raúl Paz') }),
    );

    expect(await screen.findByText('Nota para cocina: Alergia a la nuez')).toBeOnTheScreen();
    expect(screen.getByText('Nota: Sin ajonjolí')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /^Cobrar/ })).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Marcar como lista' }));
    await waitFor(() => expect(deps.updateOrderStatusUseCase.execute).toHaveBeenCalledWith('d', 'lista'));
  });

  it('caja puede cobrar un pedido entregado y ve la propina', async () => {
    const deps = setup('cajero', {
      getOrderDetailUseCase: {
        execute: jest.fn().mockResolvedValue(makeOrderDetail({ status: 'entregada', tip: 20 })),
      },
      listPaymentMethodsUseCase: { execute: jest.fn(() => new Promise<never>(() => {})) },
    });
    await openOrder(deps);

    const card = await screen.findByText('Propina');
    expect(within(card.parent!.parent!).getByText('$20.00')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Cobrar' }));
    expect(await screen.findByText('Preparando el cobro…')).toBeOnTheScreen();
  });

  it('un error inesperado usa un mensaje genérico', async () => {
    const remove = jest.fn().mockRejectedValue(new Error('boom'));
    await openOrder(setup('mesero', { removeOrderItemUseCase: { execute: remove } }));

    await fireEvent.press(await screen.findByRole('button', { name: 'Quitar Enchiladas suizas' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo actualizar el pedido.');
  });

  it('un pedido pagado no ofrece acciones y uno sin platillos lo dice', async () => {
    await openOrder(
      setup('admin', {
        getOrderDetailUseCase: {
          execute: jest.fn().mockResolvedValue(makeOrderDetail({ status: 'pagada', items: [] })),
        },
      }),
    );

    expect(await screen.findByText('Este pedido ya no tiene platillos.')).toBeOnTheScreen();
    expect(screen.getByText('Pagada')).toBeOnTheScreen();
    for (const name of ['Confirmar y enviar a cocina', 'Cancelar pedido', 'Cobrar', 'Entregar en la mesa']) {
      expect(screen.queryByRole('button', { name })).toBeNull();
    }
  });

  it('si no se puede cargar el detalle muestra el error y permite reintentar', async () => {
    const execute = jest
      .fn()
      .mockRejectedValueOnce(new AppError('not-found', 'Este pedido ya no está disponible.'))
      .mockResolvedValue(makeOrderDetail());
    await openOrder(setup('mesero', { getOrderDetailUseCase: { execute } }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Este pedido ya no está disponible.');
    await fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Enchiladas suizas')).toBeOnTheScreen();
  });
});
