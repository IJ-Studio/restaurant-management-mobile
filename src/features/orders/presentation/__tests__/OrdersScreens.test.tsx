import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert, type AlertButton } from 'react-native';

import { AppError } from '../../../../core/errors/AppError';
import { makeTestDependencies } from '../../../../core/testing/makeTestDependencies';
import { renderWithProviders } from '../../../../core/testing/renderWithProviders';
import type { Dependencies } from '../../../../core/di/dependencies';
import { makeSession } from '../../../auth/__fixtures__/auth';
import type { Role } from '../../../auth/domain/entities/Role';
import { makeActiveOrder, makeOrderDetail } from '../../__fixtures__/orders';
import { OrdersNavigator } from '../navigation/OrdersNavigator';

const ORDERS = [
  makeActiveOrder({ id: 'a', place: 'Mesa 5', tableNumber: '5', status: 'abierta', customer: 'Ana López' }),
  makeActiveOrder({ id: 'b', place: 'Mesa 2', tableNumber: '2', status: 'pendiente', customer: 'Luis Gil' }),
  makeActiveOrder({
    id: 'c',
    place: 'Domicilio',
    tableNumber: undefined,
    status: 'abierta',
    customer: 'Eva',
  }),
];

function setup(role: Role = 'mesero', overrides: Partial<Dependencies> = {}) {
  const deps = makeTestDependencies({
    listActiveOrdersUseCase: { execute: jest.fn().mockResolvedValue(ORDERS) },
    getOrderDetailUseCase: { execute: jest.fn().mockResolvedValue(makeOrderDetail()) },
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

async function openOrder(deps: Dependencies, label = 'Mesa 5, En cocina, Ana López, $336.00') {
  await renderOrders(deps);
  await fireEvent.press(await screen.findByRole('button', { name: label }));
}

describe('Pedidos: lista', () => {
  it('muestra los pedidos del día con su estatus y filtra por estatus', async () => {
    await renderOrders(setup());

    expect(
      await screen.findByRole('button', { name: 'Mesa 5, En cocina, Ana López, $336.00' }),
    ).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Todos · 3' })).toBeSelected();

    await fireEvent.press(screen.getByRole('radio', { name: 'Por confirmar · 1' }));
    expect(screen.getByText('Mesa 2')).toBeOnTheScreen();
    expect(screen.queryByText('Mesa 5')).toBeNull();
  });

  it('un pedido a domicilio no abre detalle', async () => {
    await renderOrders(setup());
    expect(await screen.findByText('Domicilio')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /^Domicilio/ })).toBeNull();
  });

  it('avisa cuando el filtro no tiene pedidos', async () => {
    await renderOrders(
      setup('mesero', { listActiveOrdersUseCase: { execute: jest.fn().mockResolvedValue([ORDERS[0]]) } }),
    );
    await fireEvent.press(await screen.findByRole('radio', { name: 'Por confirmar · 0' }));
    expect(screen.getByText('No hay pedidos por confirmar.')).toBeOnTheScreen();
  });

  it('cocina ve los pedidos pero no los abre', async () => {
    await renderOrders(setup('cocina'));

    expect(await screen.findByText(/Vista de cocina/)).toBeOnTheScreen();
    expect(screen.getByText('Mesa 5')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /^Mesa 5/ })).toBeNull();
  });

  it('si falla la consulta muestra el error y permite reintentar', async () => {
    const execute = jest
      .fn()
      .mockRejectedValueOnce(new AppError('network', 'No hay conexión con el servidor.'))
      .mockResolvedValue([]);
    await renderOrders(setup('admin', { listActiveOrdersUseCase: { execute } }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No hay conexión con el servidor.');
    await fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('No hay pedidos activos hoy.')).toBeOnTheScreen();
  });
});

describe('Pedidos: detalle', () => {
  it('muestra los platillos y manda a cocina un pedido pendiente', async () => {
    const confirm = jest.fn().mockResolvedValue({ orderId: 'a', message: 'Tu pedido fue enviado a cocina.' });
    const deps = setup('mesero', { confirmOrderUseCase: { execute: confirm } });
    await openOrder(deps);

    expect(await screen.findByText('Enchiladas suizas')).toBeOnTheScreen();
    expect(screen.getByText('$291.00')).toBeOnTheScreen();
    expect(deps.getOrderDetailUseCase.execute).toHaveBeenCalledWith('5', 'a');

    await fireEvent.press(screen.getByRole('button', { name: 'Confirmar y enviar a cocina' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Tu pedido fue enviado a cocina.');
    expect(confirm).toHaveBeenCalledWith('a');
    // Refresca la lista y el detalle.
    await waitFor(() => expect(deps.listActiveOrdersUseCase.execute).toHaveBeenCalledTimes(2));
  });

  it('quita un platillo de un pedido pendiente', async () => {
    const remove = jest.fn().mockResolvedValue('Producto eliminado de tu pedido.');
    const deps = setup('cajero', { removeOrderItemUseCase: { execute: remove } });
    await openOrder(deps);

    await fireEvent.press(await screen.findByRole('button', { name: 'Quitar Café de olla' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Producto eliminado de tu pedido.');
    expect(remove).toHaveBeenCalledWith(102);
  });

  it('cancela un pedido en cocina después de confirmarlo en el aviso', async () => {
    const cancel = jest.fn().mockResolvedValue('Tu comanda ha sido cancelada con éxito.');
    const alert = jest
      .spyOn(Alert, 'alert')
      .mockImplementation((_title, _message, buttons?: AlertButton[]) => buttons?.[1]?.onPress?.());
    const deps = setup('admin', {
      getOrderDetailUseCase: {
        execute: jest
          .fn()
          .mockResolvedValue(makeOrderDetail({ status: 'abierta', openedAt: new Date().toISOString() })),
      },
      cancelOrderUseCase: { execute: cancel },
    });
    await openOrder(deps);

    expect(await screen.findByText(/primeros 2 minutos/)).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Quitar Café de olla' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Cancelar pedido' }));

    expect(alert).toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent('Tu comanda ha sido cancelada con éxito.');
    expect(cancel).toHaveBeenCalledWith('a');
    alert.mockRestore();
  });

  it('muestra el motivo del API cuando una acción falla', async () => {
    const confirm = jest
      .fn()
      .mockRejectedValue(new AppError('validation', 'No puedes confirmar un pedido sin productos.'));
    await openOrder(setup('mesero', { confirmOrderUseCase: { execute: confirm } }));

    await fireEvent.press(await screen.findByRole('button', { name: 'Confirmar y enviar a cocina' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No puedes confirmar un pedido sin productos.',
    );
  });

  it('un error inesperado usa un mensaje genérico', async () => {
    const remove = jest.fn().mockRejectedValue(new Error('boom'));
    await openOrder(setup('mesero', { removeOrderItemUseCase: { execute: remove } }));

    await fireEvent.press(await screen.findByRole('button', { name: 'Quitar Enchiladas suizas' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo actualizar el pedido.');
  });

  it('un pedido pagado no ofrece acciones y uno sin platillos lo dice', async () => {
    await openOrder(
      setup('mesero', {
        getOrderDetailUseCase: {
          execute: jest.fn().mockResolvedValue(makeOrderDetail({ status: 'pagada', items: [] })),
        },
      }),
    );

    expect(await screen.findByText('Este pedido ya no tiene platillos.')).toBeOnTheScreen();
    expect(screen.getByText('Pagada')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Confirmar y enviar a cocina' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cancelar pedido' })).toBeNull();
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
