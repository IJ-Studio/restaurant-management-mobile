import { fireEvent, screen } from '@testing-library/react-native';

import { AppError } from '../../../../core/errors/AppError';
import { makeTestDependencies } from '../../../../core/testing/makeTestDependencies';
import { renderWithProviders } from '../../../../core/testing/renderWithProviders';
import { makeDashboardSummary } from '../../__fixtures__/dashboard';
import { DashboardScreen, greeting } from '../screens/DashboardScreen';

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

describe('greeting', () => {
  it('saluda según la hora del día', () => {
    expect(greeting(new Date(2026, 9, 28, 9))).toBe('Buenos días');
    expect(greeting(new Date(2026, 9, 28, 15))).toBe('Buenas tardes');
    expect(greeting(new Date(2026, 9, 28, 21))).toBe('Buenas noches');
  });
});
