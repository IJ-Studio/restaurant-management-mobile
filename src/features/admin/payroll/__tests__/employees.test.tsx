import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import type { HttpClient } from '../../../../core/http/httpClient';
import { makeTestDependencies } from '../../../../core/testing/makeTestDependencies';
import { renderWithProviders } from '../../../../core/testing/renderWithProviders';
import { PayrollEmployeesRepositoryImpl } from '../data/PayrollEmployeesRepositoryImpl';
import {
  EmployeeValidationError,
  SaveEmployeeUseCase,
  type PayrollEmployeesRepository,
} from '../domain/Employees';
import { parsePeriod, shiftPeriod, type PayrollRepository } from '../domain/Payroll';
import { PayrollEmployeesScreen } from '../presentation/PayrollEmployeesScreen';
import { PayrollScreen } from '../presentation/PayrollScreen';

const repo = (): jest.Mocked<PayrollEmployeesRepository> => ({
  list: jest.fn().mockResolvedValue([
    { id: 'a', name: 'Rosa Pérez', role: 'Chef 1', weeklyPay: 3500, active: true },
    { id: 'b', name: 'Luis Gómez', role: 'Mesero 2', weeklyPay: 2000, active: false },
  ]),
  create: jest.fn().mockResolvedValue(undefined),
  update: jest.fn().mockResolvedValue(undefined),
  remove: jest.fn().mockResolvedValue(undefined),
});

describe('nómina: periodo (Fase 2, como Desde/Hasta en la web)', () => {
  it('mueve la semana y valida fechas reales y en orden', () => {
    expect(shiftPeriod({ start: '2026-11-02', end: '2026-11-08' }, -1)).toEqual({
      start: '2026-10-26',
      end: '2026-11-01',
    });
    expect(shiftPeriod({ start: '2026-12-28', end: '2027-01-03' }, 1)).toEqual({
      start: '2027-01-04',
      end: '2027-01-10',
    });
    expect(parsePeriod(' 2026-11-01 ', '2026-11-15')).toEqual({ start: '2026-11-01', end: '2026-11-15' });
    expect(parsePeriod('2026-02-30', '2026-03-01')).toEqual({ error: 'Escribe las fechas como AAAA-MM-DD.' });
    expect(parsePeriod('2026-11-15', '2026-11-01')).toEqual({
      error: 'La fecha «Desde» no puede ser posterior a «Hasta».',
    });
  });

  it('«Semana anterior» vuelve a pedir el resumen con el periodo nuevo', async () => {
    const summary = jest.fn().mockResolvedValue([]);
    const payroll: jest.Mocked<PayrollRepository> = {
      summary,
      movements: jest.fn().mockResolvedValue([]),
      add: jest.fn(),
      correct: jest.fn(),
    };
    await renderWithProviders(<PayrollScreen />, makeTestDependencies({ payrollRepository: payroll }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Semana anterior' }));
    await waitFor(() => expect(summary).toHaveBeenCalledTimes(2));
    const [first, second] = summary.mock.calls.map(([p]) => p);
    expect(second).toEqual(shiftPeriod(first, -1));
  });
});

describe('nómina: empleados', () => {
  it('valida como la web y no llama al API si falta algo', async () => {
    const r = repo();
    const uc = new SaveEmployeeUseCase(r);
    const error = await uc
      .execute({ name: ' ', role: '', weeklyPay: Number.NaN, active: true })
      .catch((e: unknown) => e);
    expect((error as EmployeeValidationError).errors).toEqual({
      name: 'Escribe el nombre.',
      role: 'Escribe el puesto.',
      weeklyPay: 'Escribe un pago mayor que cero.',
    });
    expect(r.create).not.toHaveBeenCalled();
    await uc.execute({ name: ' Ana ', role: 'Gerente ', weeklyPay: 5000, active: true });
    expect(r.create).toHaveBeenCalledWith({ name: 'Ana', role: 'Gerente', weeklyPay: 5000, active: true });
    await uc.execute({ name: 'Ana', role: 'Gerente', weeklyPay: 5100, active: false }, 'x');
    expect(r.update).toHaveBeenCalledWith('x', {
      name: 'Ana',
      role: 'Gerente',
      weeklyPay: 5100,
      active: false,
    });
  });

  it('repositorio: mismas rutas y cuerpos que la web', async () => {
    const http = {
      get: jest.fn().mockResolvedValue([{ id: 3, name: 'A', role: 'B', weeklyPay: '1500.50', active: true }]),
      post: jest.fn().mockResolvedValue({}),
      patch: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    };
    const r = new PayrollEmployeesRepositoryImpl(http as unknown as HttpClient);
    await expect(r.list()).resolves.toEqual([
      { id: '3', name: 'A', role: 'B', weeklyPay: 1500.5, active: true },
    ]);
    await r.create({ name: 'A', role: 'B', weeklyPay: 1, active: true });
    await r.update('3', { active: false });
    await r.remove('3');
    expect(http.get).toHaveBeenCalledWith('payroll');
    expect(http.post).toHaveBeenCalledWith('payroll', { name: 'A', role: 'B', weeklyPay: 1, active: true });
    expect(http.patch).toHaveBeenCalledWith('payroll/3', { active: false });
    expect(http.delete).toHaveBeenCalledWith('payroll/3');
  });

  it('pantalla: total semanal de activos, errores por campo, activar y quitar con confirmación', async () => {
    const r = repo();
    const deps = makeTestDependencies({
      payrollEmployeesRepository: r,
      saveEmployeeUseCase: new SaveEmployeeUseCase(r),
    });
    await renderWithProviders(<PayrollEmployeesScreen />, deps);

    expect(await screen.findByText('Rosa Pérez')).toBeOnTheScreen();
    expect(screen.getByText(/^1 activos · /)).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Añadir a la nómina' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Añadir' }));
    expect(await screen.findByText('Escribe un pago mayor que cero.')).toBeOnTheScreen();
    expect(r.create).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByLabelText('Activar a Luis Gómez en la nómina'));
    await waitFor(() => expect(r.update).toHaveBeenCalledWith('b', { active: true }));

    await fireEvent.press(screen.getByLabelText('Quitar a Rosa Pérez de la nómina'));
    await fireEvent.press(screen.getByRole('button', { name: 'Quitar de la nómina' }));
    await waitFor(() => expect(r.remove).toHaveBeenCalledWith('a'));
    expect(await screen.findByText('Rosa Pérez ya no está en la nómina.')).toBeOnTheScreen();
  });
});
