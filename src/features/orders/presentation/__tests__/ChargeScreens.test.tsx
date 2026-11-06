import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { AppError } from '../../../../core/errors/AppError';
import type { Dependencies } from '../../../../core/di/dependencies';
import { makeTestDependencies } from '../../../../core/testing/makeTestDependencies';
import { renderWithProviders } from '../../../../core/testing/renderWithProviders';
import { makeSession } from '../../../auth/__fixtures__/auth';
import {
  cash,
  debit,
  makeActiveOrder,
  makeOrderDetail,
  makePaymentMethods,
  makeReceipt,
} from '../../__fixtures__/orders';
import { CheckoutNavigator } from '../navigation/CheckoutNavigator';
import { cashSuggestions } from '../viewmodels/useCharge';

// Cada cobro recorre varias pantallas con muchos toques: con la máquina cargada pasa de 5 s.
jest.setTimeout(20_000);

const ORDERS = [
  makeActiveOrder({ id: 'cocina', place: 'Mesa 1', status: 'abierta', total: 100 }),
  makeActiveOrder({ id: 'servida', place: 'Mesa 2', status: 'entregada', total: 336 }),
  makeActiveOrder({ id: 'carrito', place: 'Mesa 3', status: 'pendiente', total: 50 }),
  makeActiveOrder({ id: 'lista', place: 'Mesa 4', status: 'lista', total: 80 }),
];

function setup(overrides: Partial<Dependencies> = {}) {
  const deps = makeTestDependencies({
    listActiveOrdersUseCase: { execute: jest.fn().mockResolvedValue(ORDERS) },
    getOrderDetailUseCase: { execute: jest.fn().mockResolvedValue(makeOrderDetail({ status: 'entregada' })) },
    listPaymentMethodsUseCase: {
      execute: jest.fn().mockResolvedValue([cash, ...makePaymentMethods().slice(0, 1)]),
    },
    chargeOrderUseCase: { execute: jest.fn().mockResolvedValue(makeReceipt()) },
    ...overrides,
  });
  const session = makeSession();
  session.user.role = 'cajero';
  deps.sessionStore.getState().setSession(session);
  return deps;
}

async function openCharge(deps: Dependencies) {
  await renderWithProviders(
    <NavigationContainer>
      <CheckoutNavigator />
    </NavigationContainer>,
    deps,
  );
  await fireEvent.press(await screen.findByRole('button', { name: /^Mesa 2, Por cobrar/ }));
  await screen.findByLabelText('Total a cobrar $336.00');
}

describe('Cobros: lista', () => {
  it('muestra lo que se puede cobrar, primero lo ya servido, con el total pendiente', async () => {
    await renderWithProviders(
      <NavigationContainer>
        <CheckoutNavigator />
      </NavigationContainer>,
      setup(),
    );

    expect(await screen.findByLabelText('Por cobrar, $516.00')).toBeOnTheScreen();
    expect(screen.getByLabelText('Cuentas abiertas, 3')).toBeOnTheScreen();
    const places = screen.getAllByText(/^Mesa \d$/).map((node) => node.props.children);
    expect(places).toEqual(['Mesa 2', 'Mesa 4', 'Mesa 1']);
  });

  it('sin cuentas lo dice; si falla permite reintentar', async () => {
    const execute = jest
      .fn()
      .mockRejectedValueOnce(new AppError('network', 'No hay conexión con el servidor.'))
      .mockResolvedValue([]);
    await renderWithProviders(
      <NavigationContainer>
        <CheckoutNavigator />
      </NavigationContainer>,
      setup({ listActiveOrdersUseCase: { execute } }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('No hay conexión con el servidor.');
    await fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('No hay cuentas por cobrar.')).toBeOnTheScreen();
  });
});

describe('Cobros: cobro', () => {
  it('en efectivo calcula propina y cambio, y muestra el comprobante', async () => {
    const deps = setup();
    await openCharge(deps);

    // Efectivo viene seleccionado: hasta escribir lo recibido no se puede cobrar.
    expect(screen.getByRole('radio', { name: 'Efectivo' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'Confirmar cobro' })).toBeDisabled();
    expect(screen.getByText('Escribe con cuánto pagó el cliente.')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('radio', { name: 'Propina 10%' }));
    expect(screen.getByLabelText('Total a cobrar $369.60')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText('Efectivo recibido'), '300');
    expect(screen.getByText('Faltan')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Confirmar cobro' })).toBeDisabled();

    await fireEvent.press(screen.getByRole('button', { name: 'Recibí $500.00' }));
    expect(screen.getByText('$130.40')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Confirmar cobro' }));

    expect(await screen.findByText('Cobrado $370.00')).toBeOnTheScreen();
    expect(screen.getByText('Cambio a entregar')).toBeOnTheScreen();
    expect(deps.chargeOrderUseCase.execute).toHaveBeenCalledWith({ id: 'servida', remaining: 336 }, cash, {
      tip: 33.6,
      amount: undefined,
      label: undefined,
      received: 500,
      reference: undefined,
    });
    await waitFor(() => expect(deps.listActiveOrdersUseCase.execute).toHaveBeenCalledTimes(2));

    await fireEvent.press(screen.getByRole('button', { name: 'Listo' }));
    expect(await screen.findByLabelText('Por cobrar, $516.00')).toBeOnTheScreen();
  });

  it('con tarjeta pide la referencia opcional y acepta propina libre', async () => {
    const deps = setup({
      chargeOrderUseCase: {
        execute: jest.fn().mockResolvedValue(makeReceipt({ change: 0, method: 'Tarjeta débito' })),
      },
    });
    await openCharge(deps);

    await fireEvent.press(screen.getByRole('radio', { name: 'Tarjeta débito' }));
    await fireEvent.changeText(screen.getByLabelText('Otra propina'), '25');
    await fireEvent.changeText(screen.getByLabelText('Referencia'), 'AUT-77');
    expect(screen.getByLabelText('Total a cobrar $361.00')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Confirmar cobro' }));

    expect(await screen.findByText('Cobrado $370.00')).toBeOnTheScreen();
    expect(screen.queryByText('Cambio a entregar')).toBeNull();
    expect(deps.chargeOrderUseCase.execute).toHaveBeenCalledWith({ id: 'servida', remaining: 336 }, debit, {
      tip: 25,
      amount: undefined,
      label: undefined,
      received: undefined,
      reference: 'AUT-77',
    });
  });

  it('muestra el motivo del API cuando el cobro falla', async () => {
    const deps = setup({
      chargeOrderUseCase: {
        execute: jest.fn().mockRejectedValue(new AppError('validation', 'Este pedido ya está pagado.')),
      },
    });
    await openCharge(deps);

    await fireEvent.press(screen.getByRole('radio', { name: 'Tarjeta débito' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Confirmar cobro' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Este pedido ya está pagado.');
  });

  it('sin métodos de pago o sin pedido muestra el error', async () => {
    await openCharge(
      setup({ listPaymentMethodsUseCase: { execute: jest.fn().mockResolvedValue([]) } }),
    ).catch(() => undefined);
    expect(await screen.findByText(/No hay métodos de pago activos/)).toBeOnTheScreen();
  });

  it('si no carga el pedido permite reintentar', async () => {
    const execute = jest
      .fn()
      .mockRejectedValueOnce(new AppError('not-found', 'Este pedido ya no está disponible.'))
      .mockResolvedValue(makeOrderDetail({ status: 'entregada' }));
    const deps = setup({ getOrderDetailUseCase: { execute } });
    await renderWithProviders(
      <NavigationContainer>
        <CheckoutNavigator />
      </NavigationContainer>,
      deps,
    );
    await fireEvent.press(await screen.findByRole('button', { name: /^Mesa 2, Por cobrar/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Este pedido ya no está disponible.');
    await fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByLabelText('Total a cobrar $336.00')).toBeOnTheScreen();
  });
});

describe('Cobros: cuenta separada', () => {
  it('en partes iguales cobra a cada persona y sigue con la siguiente', async () => {
    const execute = jest.fn().mockResolvedValue(
      makeReceipt({
        charged: 168,
        total: 168,
        tip: 0,
        change: 0,
        paid: 168,
        remaining: 168,
        closed: false,
        message: 'Pago registrado. Faltan $168.00 por cobrar.',
      }),
    );
    const deps = setup({
      getOrderDetailUseCase: {
        execute: jest
          .fn()
          .mockResolvedValueOnce(makeOrderDetail({ status: 'entregada', guests: 2 }))
          .mockResolvedValue(
            makeOrderDetail({
              status: 'entregada',
              guests: 2,
              paid: 168,
              remaining: 168,
              payments: [
                { id: 1, method: 'Tarjeta débito', amount: 168, tip: 0, reference: 'Persona 1 de 2' },
              ],
            }),
          ),
      },
      chargeOrderUseCase: { execute },
    });
    await openCharge(deps);

    await fireEvent.press(screen.getByRole('radio', { name: 'Partes iguales' }));
    expect(screen.getByText('Cobrando a la persona 1 de 2 · $168.00')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Más personas en la cuenta' }));
    expect(screen.getByLabelText('Total a cobrar $112.00')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Menos personas en la cuenta' }));

    await fireEvent.press(screen.getByRole('radio', { name: 'Tarjeta débito' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Confirmar cobro' }));

    expect(execute).toHaveBeenCalledWith(
      { id: 'servida', remaining: 336 },
      debit,
      expect.objectContaining({
        amount: 168,
        label: 'Persona 1 de 2',
      }),
    );
    expect(await screen.findByText('Falta por cobrar')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Cobrar a la siguiente persona' }));
    expect(await screen.findByText('Cobrando a la persona 2 de 2 · $168.00')).toBeOnTheScreen();
    expect(screen.getByText('Ya pagado $168.00 · falta $168.00')).toBeOnTheScreen();
  });

  it('por platillo cobra solo lo que eligió la persona y muestra lo ya pagado', async () => {
    const execute = jest.fn().mockResolvedValue(makeReceipt({ closed: false, remaining: 100 }));
    const deps = setup({
      getOrderDetailUseCase: {
        execute: jest.fn().mockResolvedValue(
          makeOrderDetail({
            status: 'entregada',
            paid: 45,
            remaining: 291,
            payments: [
              {
                id: 1,
                method: 'Efectivo',
                amount: 45,
                tip: 0,
                reference: '1× Café de olla',
                cashier: 'Carlos',
              },
            ],
          }),
        ),
      },
      chargeOrderUseCase: { execute },
    });
    await openCharge(deps).catch(() => undefined);

    expect(await screen.findByText('Ya pagado $45.00 · falta $291.00')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('radio', { name: 'Por platillo' }));
    expect(screen.getByRole('button', { name: 'Confirmar cobro' })).toBeDisabled();
    expect(screen.getByText('Elige los platillos que paga esta persona.')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Agregar Enchiladas suizas a esta cuenta' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Agregar Enchiladas suizas a esta cuenta' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Agregar Enchiladas suizas a esta cuenta' }));
    expect(screen.getByLabelText('2 de Enchiladas suizas')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Quitar Enchiladas suizas de esta cuenta' }));
    expect(screen.getByLabelText('Total a cobrar $145.50')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('radio', { name: 'Tarjeta débito' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Confirmar cobro' }));
    expect(execute).toHaveBeenCalledWith(
      { id: 'servida', remaining: 291 },
      debit,
      expect.objectContaining({
        amount: 145.5,
        label: '1× Enchiladas suizas',
      }),
    );
  });
});

describe('cashSuggestions', () => {
  it('propone el exacto y los billetes siguientes sin repetir', () => {
    expect(cashSuggestions(336)).toEqual([336, 350, 400, 500]);
    expect(cashSuggestions(100)).toEqual([100, 200, 500, 1000]);
    expect(cashSuggestions(1200)).toEqual([1200, 1500, 2000]);
  });
});
