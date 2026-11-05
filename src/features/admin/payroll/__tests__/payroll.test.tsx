import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithProviders } from '../../../../core/testing/renderWithProviders';
import { makeTestDependencies } from '../../../../core/testing/makeTestDependencies';
import { AddPayrollMovementUseCase, CorrectPayrollMovementUseCase, currentWeek, type PayrollRepository } from '../domain/Payroll';
import { PayrollScreen } from '../presentation/PayrollScreen';

const repo = (): jest.Mocked<PayrollRepository> => ({
  summary: jest.fn(),
  movements: jest.fn(),
  add: jest.fn().mockResolvedValue(undefined),
  correct: jest.fn().mockResolvedValue(undefined),
});
const period = { start: '2026-11-02', end: '2026-11-08' };

describe('nómina: dominio (Prioridad 3.1)', () => {
  it('exige justificación, monto positivo y concepto válido; no llama al API si falta algo', async () => {
    const r = repo();
    const uc = new AddPayrollMovementUseCase(r);
    const base = { employeeId: 'e1', type: 'resta' as const, concept: 'objeto_roto', amount: 10, period, justification: 'Rompió una copa' };
    await expect(uc.execute({ ...base, justification: ' ' })).rejects.toThrow('Explica el motivo');
    await expect(uc.execute({ ...base, amount: 0 })).rejects.toThrow('monto');
    await expect(uc.execute({ ...base, concept: 'correccion' })).rejects.toThrow('concepto');
    expect(r.add).not.toHaveBeenCalled();
    await uc.execute({ ...base, amount: 10.005 });
    expect(r.add).toHaveBeenCalledWith(expect.objectContaining({ amount: 10.01 }));
    await expect(new CorrectPayrollMovementUseCase(r).execute(1, 'no')).rejects.toThrow();
  });

  it('la semana va de lunes a domingo', () => {
    expect(currentWeek(new Date(2026, 10, 5))).toEqual({ start: '2026-11-02', end: '2026-11-08' });
  });
});

describe('nómina: pantalla', () => {
  it('muestra el neto, «Ver cálculo» cuadra con el desglose y se registra una resta', async () => {
    const add = jest.fn().mockResolvedValue(undefined);
    const deps = makeTestDependencies({
      payrollRepository: {
        summary: jest.fn().mockResolvedValue([
          { employeeId: 'e1', name: 'ANA LÓPEZ', role: 'MESERA', base: 800, additions: 0, deductions: 45.35, net: 754.65,
            calculation: { formula: 'neto = base + sumas − restas', data: [{ key: 'base', value: 800 }, { key: 'resta:consumo#1', value: -45.35 }] } },
        ]),
        movements: jest.fn().mockResolvedValue([]),
      },
      addPayrollMovementUseCase: { execute: add },
    });
    await renderWithProviders(<PayrollScreen />, deps);
    expect(await screen.findByText('Ana López')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Ver cálculo' }));
    const calc = screen.getByLabelText('Cálculo del neto de Ana López');
    expect(calc).toHaveTextContent(/754\.65/);
    await fireEvent.press(screen.getByRole('button', { name: 'Sumar o restar a Ana López' }));
    await fireEvent.changeText(screen.getByLabelText('Monto'), '20');
    await fireEvent.changeText(screen.getByLabelText('Justificación'), 'Rompió un plato');
    await fireEvent.press(screen.getByRole('button', { name: 'Registrar' }));
    expect(add).toHaveBeenCalledWith(expect.objectContaining({ employeeId: 'e1', type: 'resta', amount: 20, justification: 'Rompió un plato' }));
  });
});
