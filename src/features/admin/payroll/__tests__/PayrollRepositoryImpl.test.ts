import type { HttpClient } from '../../../../core/http/httpClient';
import { PayrollRepositoryImpl } from '../data/PayrollRepositoryImpl';

const period = { start: '2026-11-02', end: '2026-11-08' };

function setup(http: Partial<Record<'get' | 'post', jest.Mock>>) {
  return new PayrollRepositoryImpl(http as unknown as HttpClient);
}

describe('PayrollRepositoryImpl', () => {
  it('pide el resumen del periodo y traduce el cálculo', async () => {
    const get = jest.fn().mockResolvedValue([
      {
        empleadoId: 'E1',
        nombre: 'ANA',
        puesto: 'MESERO',
        base: 1000,
        sumas: 200,
        restas: 50,
        neto: 1150,
        calculo: {
          formula: 'base + sumas - restas',
          periodo: { inicio: '2026-11-02', fin: '2026-11-08' },
          datos: [
            { clave: 'base', valor: 1000, origen: 'nómina' },
            { clave: 'sumas', valor: 200 },
          ],
        },
      },
    ]);

    await expect(setup({ get }).summary(period)).resolves.toEqual([
      {
        employeeId: 'E1',
        name: 'ANA',
        role: 'MESERO',
        base: 1000,
        additions: 200,
        deductions: 50,
        net: 1150,
        calculation: {
          formula: 'base + sumas - restas',
          period: { start: '2026-11-02', end: '2026-11-08' },
          data: [
            { key: 'base', value: 1000, source: 'nómina' },
            { key: 'sumas', value: 200, source: undefined },
          ],
        },
      },
    ]);
    expect(get).toHaveBeenCalledWith('payroll/movimientos/resumen?desde=2026-11-02&hasta=2026-11-08');
  });

  it('sin nombre, puesto ni periodo en el cálculo usa textos vacíos y periodo indefinido', async () => {
    const get = jest.fn().mockResolvedValue([
      {
        empleadoId: 'E2',
        nombre: null,
        puesto: null,
        base: 0,
        sumas: 0,
        restas: 0,
        neto: 0,
        calculo: { formula: 'base', datos: [] },
      },
    ]);

    const [row] = await setup({ get }).summary(period);
    expect(row.name).toBe('');
    expect(row.role).toBe('');
    expect(row.calculation.period).toBeUndefined();
    expect(row.calculation.data).toEqual([]);
  });

  it('lista los movimientos del periodo con su corrección', async () => {
    const get = jest.fn().mockResolvedValue({
      movimientos: [
        {
          id: 7,
          empleado: 'ANA',
          tipo: 'resta',
          concepto: 'Faltante de caja',
          monto: 50,
          fecha: '2026-11-03',
          justificacion: 'Corte del lunes',
          autor: 'ADMIN',
          corrigeId: null,
          corregidoPor: 9,
        },
        {
          id: 9,
          empleado: null,
          tipo: 'suma',
          concepto: 'Corrección',
          monto: 50,
          fecha: '2026-11-04',
          justificacion: 'Se encontró el faltante',
          autor: 'ADMIN',
          corrigeId: 7,
          corregidoPor: null,
        },
      ],
    });

    await expect(setup({ get }).movements(period)).resolves.toEqual([
      {
        id: 7,
        employee: 'ANA',
        type: 'resta',
        concept: 'Faltante de caja',
        amount: 50,
        date: '2026-11-03',
        justification: 'Corte del lunes',
        author: 'ADMIN',
        correctsId: null,
        correctedBy: 9,
      },
      {
        id: 9,
        employee: '',
        type: 'suma',
        concept: 'Corrección',
        amount: 50,
        date: '2026-11-04',
        justification: 'Se encontró el faltante',
        author: 'ADMIN',
        correctsId: 7,
        correctedBy: null,
      },
    ]);
    expect(get).toHaveBeenCalledWith('payroll/movimientos?desde=2026-11-02&hasta=2026-11-08');
  });

  it('registra un movimiento con los nombres de campo del API', async () => {
    const post = jest.fn().mockResolvedValue(undefined);

    await setup({ post }).add({
      employeeId: 'E1',
      type: 'suma',
      concept: 'Bono',
      amount: 100,
      period,
      justification: 'Meta de ventas',
    });

    expect(post).toHaveBeenCalledWith('payroll/movimientos', {
      empleadoId: 'E1',
      tipo: 'suma',
      concepto: 'Bono',
      monto: 100,
      periodoInicio: '2026-11-02',
      periodoFin: '2026-11-08',
      justificacion: 'Meta de ventas',
    });
  });

  it('corrige un movimiento con su justificación', async () => {
    const post = jest.fn().mockResolvedValue(undefined);

    await setup({ post }).correct(7, 'Se capturó dos veces');

    expect(post).toHaveBeenCalledWith('payroll/movimientos/7/corregir', {
      justificacion: 'Se capturó dos veces',
    });
  });

  it('propaga el error del API', async () => {
    const get = jest.fn().mockRejectedValue(new Error('Sin conexión'));
    await expect(setup({ get }).summary(period)).rejects.toThrow('Sin conexión');
  });
});
