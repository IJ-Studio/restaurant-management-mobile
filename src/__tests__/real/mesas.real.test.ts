/**
 * @jest-environment node
 */
import { TablesRepositoryImpl } from '../../features/admin/tables/data/TablesRepositoryImpl';
import { SaveTableUseCase } from '../../features/admin/tables/domain/Tables';
import { clienteComo, describeReal } from '../../core/testing/clienteReal';

jest.setTimeout(60_000);

describeReal('móvil contra el API real: mesas (Prioridad 1.3)', () => {
  it('el admin añade, edita y borra una mesa sin historial; la que tiene historial solo se desactiva', async () => {
    const repo = new TablesRepositoryImpl(await clienteComo('admin'));
    const number = `M${String(Date.now()).slice(-5)}`;
    const [area] = await repo.areas();
    await new SaveTableUseCase(repo).execute({
      number,
      name: null,
      capacity: 2,
      shape: 'barra',
      areaId: area.id,
    });
    let mia = (await repo.list()).find((t) => t.number === number)!;
    expect(mia).toMatchObject({ capacity: 2, areaId: area.id, active: true, hasHistory: false });
    await new SaveTableUseCase(repo).execute(
      { number, name: null, capacity: 6, shape: 'barra', areaId: null },
      mia.id,
    );
    mia = (await repo.list()).find((t) => t.id === mia.id)!;
    expect(mia).toMatchObject({ capacity: 6, areaId: null });
    expect((await repo.remove(mia.id)).result).toBe('eliminada');
    expect((await repo.list()).some((t) => t.id === mia.id)).toBe(false);

    const conHistorial = (await repo.list()).find((t) => t.hasHistory)!;
    expect((await repo.remove(conHistorial.id)).result).toBe('desactivada');
    await repo.update(conHistorial.id, { active: true });
    expect((await repo.list()).find((t) => t.id === conHistorial.id)?.active).toBe(true);
  });

  it('el cajero no administra mesas (403)', async () => {
    const repo = new TablesRepositoryImpl(await clienteComo('cajero'));
    await expect(repo.list()).rejects.toMatchObject({ kind: 'forbidden' });
  });
});
