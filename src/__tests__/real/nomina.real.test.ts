/**
 * @jest-environment node
 */
import { PayrollRepositoryImpl } from '../../features/admin/payroll/data/PayrollRepositoryImpl';
import { AddPayrollMovementUseCase, CorrectPayrollMovementUseCase } from '../../features/admin/payroll/domain/Payroll';
import { clienteComo, describeReal } from '../../core/testing/clienteReal';

jest.setTimeout(60_000);
const periodo = { start: '2026-11-02', end: '2026-11-08' };

describeReal('móvil contra el API real: nómina (Prioridad 3.1)', () => {
  it('el admin registra una resta, la ve en el historial, el neto cuadra con el cálculo y la corrige', async () => {
    const repo = new PayrollRepositoryImpl(await clienteComo('admin'));
    const [persona] = await repo.summary(periodo);
    const marca = `Movil ${Date.now()}`;
    await new AddPayrollMovementUseCase(repo).execute({ employeeId: persona.employeeId, type: 'resta', concept: 'consumo', amount: 33.3, period: periodo, justification: marca });
    const historial = await repo.movements(periodo);
    const mio = historial.find((m) => m.justification.toUpperCase() === marca.toUpperCase());
    expect(mio).toMatchObject({ type: 'resta', amount: 33.3 });
    const ahora = (await repo.summary(periodo)).find((p) => p.employeeId === persona.employeeId)!;
    const recalculado = ahora.calculation.data.reduce((s, d) => s + Math.round(d.value * 100), 0) / 100;
    expect(recalculado).toBe(ahora.net);
    await new CorrectPayrollMovementUseCase(repo).execute(mio!.id, 'Prueba de correccion desde la movil');
    expect((await repo.movements(periodo)).find((m) => m.id === mio!.id)?.correctedBy).toBeTruthy();
  });

  it('el cajero no puede registrar movimientos (403)', async () => {
    const repo = new PayrollRepositoryImpl(await clienteComo('cajero'));
    await expect(repo.summary(periodo)).rejects.toThrow();
  });
});
