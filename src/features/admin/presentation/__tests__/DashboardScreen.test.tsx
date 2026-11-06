import { fireEvent, screen } from '@testing-library/react-native';

import { AppError } from '../../../../core/errors/AppError';
import { makeTestDependencies } from '../../../../core/testing/makeTestDependencies';
import { renderWithProviders } from '../../../../core/testing/renderWithProviders';
import { makeDailyReport, makeDashboardSummary } from '../../__fixtures__/dashboard';
import { DashboardScreen, floorTables, greeting } from '../screens/DashboardScreen';

function renderDashboard(execute: jest.Mock) {
  return renderWithProviders(<DashboardScreen />, makeTestDependencies({ getDashboardUseCase: { execute } }));
}

describe('DashboardScreen', () => {
  it('muestra los totales, el estado de las mesas y los pedidos de hoy', async () => {
    await renderDashboard(jest.fn().mockResolvedValue(makeDashboardSummary()));

    expect(screen.getByText('Resumen del día')).toBeOnTheScreen();
    expect(await screen.findByLabelText('Ventas del día, $1,250.50')).toBeOnTheScreen();
    expect(screen.getByLabelText('En cocina, 2')).toBeOnTheScreen();
    expect(screen.getByLabelText('Por confirmar, 1')).toBeOnTheScreen();
    expect(screen.getByLabelText('Mesas ocupadas, 1, de 3 mesas')).toBeOnTheScreen();

    expect(screen.getByLabelText('Mesa 2, Reservada, 4 lugares')).toBeOnTheScreen();
    expect(screen.getByLabelText('Mesa 5, Ocupada, 2 lugares')).toBeOnTheScreen();
    expect(screen.getByLabelText('Mesa 10, Libre, 6 lugares')).toBeOnTheScreen();

    expect(screen.getByText('1 activos')).toBeOnTheScreen();
    expect(screen.getByText('Ana López · 08:25 p.m.')).toBeOnTheScreen();
  });

  it('detalla quién vendió, cómo pagaron y qué pasó en cocina', async () => {
    await renderDashboard(jest.fn().mockResolvedValue(makeDashboardSummary()));

    expect(await screen.findByText('Cobrado hoy')).toBeOnTheScreen();
    expect(screen.getByText('5 cuentas · ticket promedio $250.10 · 14 comensales')).toBeOnTheScreen();
    expect(screen.getByLabelText('Propinas, $120.00, 6 cobros')).toBeOnTheScreen();

    expect(screen.getByLabelText('Ventas por hora. Hora con más ventas: 2pm, $800.50.')).toBeOnTheScreen();
    expect(screen.getByLabelText('Efectivo, $800.50, 64%, 4 cobros')).toBeOnTheScreen();
    expect(screen.getByLabelText('Tarjeta débito, $450.00, 36%, 2 cobros')).toBeOnTheScreen();
    expect(screen.getByLabelText('Mariana Pérez, $900.00, 4 pedidos · 9 comensales')).toBeOnTheScreen();
    expect(screen.getByLabelText('Luis Gil, $350.50, 3 pedidos · 5 comensales')).toBeOnTheScreen();
    expect(screen.getByLabelText('Carlos Soto, $1,250.50, 6 cobros')).toBeOnTheScreen();
    expect(screen.getByText(/^Caja abierta · Carlos Soto desde/)).toBeOnTheScreen();
    expect(screen.getByLabelText('Enchiladas suizas, 8 vendidos, $1,164.00')).toBeOnTheScreen();

    expect(screen.getByLabelText('Mesa S01, $300.00, Efectivo, cobró Carlos Soto')).toBeOnTheScreen();
    expect(screen.getByText(/propina \$30\.00/)).toBeOnTheScreen();

    expect(screen.getByLabelText('Incidencias, 1')).toBeOnTheScreen();
    expect(screen.getByLabelText('Mermas, $200.50, 2 registros')).toBeOnTheScreen();
    expect(screen.getByLabelText('Incidencia en mesa S01: Retraso de 15 min · Diego Luna')).toBeOnTheScreen();
  });

  it('un día sin cobros lo dice en cada sección', async () => {
    const empty = makeDailyReport({
      sales: { collected: 0, tips: 0, payments: 0, paidOrders: 0, averageTicket: 0, guests: 0 },
      byMethod: [],
      byCashier: [],
      byWaiter: [],
      byHour: Array.from({ length: 24 }, () => 0),
      topDishes: [],
      latestPayments: [{ orderId: 'x', amount: 100, tip: 0 }],
      incidents: [],
      waste: { records: 0, cost: 0 },
      openRegisters: [],
    });
    await renderDashboard(jest.fn().mockResolvedValue(makeDashboardSummary({ report: empty })));

    expect(await screen.findByText('Todavía no hay pedidos hoy.')).toBeOnTheScreen();
    expect(screen.getAllByText('Todavía no hay cobros hoy.')).toHaveLength(3);
    expect(screen.getByText('Todavía no se vende nada hoy.')).toBeOnTheScreen();
    expect(screen.getByLabelText('Sin mesa, $100.00, Otro, cobró pago en línea')).toBeOnTheScreen();
    expect(screen.queryByText(/^Caja abierta/)).toBeNull();
  });

  it('sin el resumen detallado muestra el total de pedidos', async () => {
    await renderDashboard(jest.fn().mockResolvedValue(makeDashboardSummary({ report: undefined })));

    expect(await screen.findByLabelText('Ventas del día, $1,250.50')).toBeOnTheScreen();
    expect(screen.getByText('Ventas del día')).toBeOnTheScreen();
    expect(screen.queryByText('Ventas por mesero')).toBeNull();
  });

  it('sin mesas ni pedidos lo dice', async () => {
    await renderDashboard(
      jest.fn().mockResolvedValue(makeDashboardSummary({ tables: [], recentOrders: [], occupiedTables: 0 })),
    );

    expect(await screen.findByText('No hay mesas activas.')).toBeOnTheScreen();
    expect(screen.getByText('Sin pedidos activos por ahora.')).toBeOnTheScreen();
  });

  it('si falla muestra el error y permite reintentar', async () => {
    const execute = jest
      .fn()
      .mockRejectedValueOnce(new AppError('forbidden', 'Solo el administrador puede ver el resumen del día.'))
      .mockResolvedValue(makeDashboardSummary());
    await renderDashboard(execute);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Solo el administrador puede ver el resumen del día.',
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByLabelText('Ventas del día, $1,250.50')).toBeOnTheScreen();
  });

  it('un error inesperado usa un mensaje genérico', async () => {
    await renderDashboard(jest.fn().mockRejectedValue(new Error('boom')));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar el resumen del día.');
  });
});

describe('floorTables', () => {
  it('una mesa por cobrar se pinta como tal', () => {
    const summary = makeDashboardSummary();
    summary.tables[1] = { ...summary.tables[1], awaitingPayment: true };
    expect(floorTables(summary).map((t) => t.state)).toEqual(['reservada', 'por_cobrar', 'libre']);
  });
});

describe('greeting', () => {
  it('saluda según la hora del día', () => {
    expect(greeting(new Date(2026, 9, 28, 9))).toBe('Buenos días');
    expect(greeting(new Date(2026, 9, 28, 15))).toBe('Buenas tardes');
    expect(greeting(new Date(2026, 9, 28, 21))).toBe('Buenas noches');
  });
});
