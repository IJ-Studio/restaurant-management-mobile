import { QueryClient } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';

import type { Dependencies } from '../../../../core/di/dependencies';
import { AppError } from '../../../../core/errors/AppError';
import { AppProviders } from '../../../../core/providers/AppProviders';
import type { Dashboard } from '../../domain/entities/Dashboard';
import { DashboardScreen } from '../screens/DashboardScreen';

const testQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity, refetchInterval: false } } });

const salesByHour = Array(24).fill(0);
salesByHour[13] = 450;
salesByHour[20] = 1080.5;

const dashboard: Dashboard = {
  stats: {
    totalSales: 1530.5,
    pendingOrders: 2,
    ordersInPreparation: 4,
    occupiedTables: 3,
    freeTables: 9,
    totalTables: 12,
  },
  salesByHour,
};

async function renderDashboard(execute: jest.Mock) {
  const dependencies = { getDashboardUseCase: { execute } } as unknown as Dependencies;
  const queryClient = testQueryClient();
  await render(
    <AppProviders dependencies={dependencies} queryClient={queryClient}>
      <DashboardScreen />
    </AppProviders>,
  );
  return queryClient;
}

describe('DashboardScreen', () => {
  it('muestra los indicadores del día', async () => {
    await renderDashboard(jest.fn().mockResolvedValue(dashboard));

    expect(await screen.findByText('$1,530.50')).toBeOnTheScreen();
    expect(screen.getByText('Pedidos pendientes')).toBeOnTheScreen();
    expect(screen.getByText('4')).toBeOnTheScreen();
    expect(screen.getByText('3 de 12')).toBeOnTheScreen();
    expect(screen.getByText('25%')).toBeOnTheScreen();
  });

  it('dibuja las ventas por hora y resalta la hora pico', async () => {
    await renderDashboard(jest.fn().mockResolvedValue(dashboard));

    expect(await screen.findByLabelText('Ventas por hora. Hora con más ventas: 20:00, $1,080.50.')).toBeOnTheScreen();
    const peakBar = screen.getByTestId('bar-20').children[0] as { props: { style: unknown } };
    const otherBar = screen.getByTestId('bar-13').children[0] as { props: { style: unknown } };
    expect(peakBar.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ height: 140 })]));
    expect(otherBar.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ height: (450 / 1080.5) * 140 })]),
    );
  });

  it('sin ventas lo dice', async () => {
    await renderDashboard(jest.fn().mockResolvedValue({ ...dashboard, salesByHour: Array(24).fill(0) }));
    expect(await screen.findByText('Sin ventas registradas hoy.')).toBeOnTheScreen();
  });

  it('muestra el error y permite reintentar', async () => {
    await renderDashboard(jest.fn().mockRejectedValue(new AppError('forbidden', 'No tienes permiso para hacer esto.')));
    expect(await screen.findByRole('alert')).toHaveTextContent('No tienes permiso para hacer esto.');
    expect(screen.getByText('Reintentar')).toBeOnTheScreen();
  });

  it('un refresco fallido no tapa los datos que ya hay', async () => {
    const execute = jest.fn().mockResolvedValueOnce(dashboard).mockRejectedValue(new AppError('network', 'Sin red'));
    const queryClient = await renderDashboard(execute);
    await screen.findByText('$1,530.50');

    await queryClient.refetchQueries();

    expect(await screen.findByText('No se pudo actualizar: Sin red')).toBeOnTheScreen();
    expect(screen.getByText('$1,530.50')).toBeOnTheScreen();
  });

  it('se refresca solo cada 30 segundos', () => {
    const { DASHBOARD_REFETCH_MS } = jest.requireActual('../viewmodels/useDashboard');
    expect(DASHBOARD_REFETCH_MS).toBe(30_000);
  });
});
