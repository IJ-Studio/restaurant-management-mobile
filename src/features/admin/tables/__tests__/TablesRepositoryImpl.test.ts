import type { HttpClient } from '../../../../core/http/httpClient';
import { TablesRepositoryImpl } from '../data/TablesRepositoryImpl';

function setup(http: Partial<Record<'get' | 'post' | 'patch' | 'delete', jest.Mock>>) {
  return new TablesRepositoryImpl(http as unknown as HttpClient);
}

const row = {
  id: 1,
  numero: '1',
  nombre: 'Ventana',
  capacidad: 4,
  forma: 'redonda',
  areaId: 2,
  areaNombre: 'TERRAZA',
  activa: true,
  conHistorial: true,
  reservasActivas: 1,
};

describe('TablesRepositoryImpl', () => {
  it('lista las mesas del admin con su área e historial', async () => {
    const get = jest.fn().mockResolvedValue([row]);

    await expect(setup({ get }).list()).resolves.toEqual([
      {
        id: 1,
        number: '1',
        name: 'Ventana',
        capacity: 4,
        shape: 'redonda',
        areaId: 2,
        areaName: 'TERRAZA',
        active: true,
        hasHistory: true,
        upcomingReservations: 1,
      },
    ]);
    expect(get).toHaveBeenCalledWith('mesas/admin');
  });

  it.each([
    [null, true],
    [true, true],
    [false, false],
  ])('activa=%p se muestra como active=%p', async (activa, active) => {
    const get = jest.fn().mockResolvedValue([{ ...row, activa }]);
    const [table] = await setup({ get }).list();
    expect(table.active).toBe(active);
  });

  it('lista las áreas', async () => {
    const get = jest.fn().mockResolvedValue([{ id: 2, nombre: 'TERRAZA' }]);

    await expect(setup({ get }).areas()).resolves.toEqual([{ id: 2, name: 'TERRAZA' }]);
    expect(get).toHaveBeenCalledWith('mesas/admin/areas');
  });

  it('crea una mesa con los nombres de campo del API', async () => {
    const post = jest.fn().mockResolvedValue(undefined);

    await setup({ post }).create({
      number: '5',
      name: null,
      capacity: 2,
      shape: 'cuadrada',
      areaId: null,
    });

    expect(post).toHaveBeenCalledWith('mesas/admin', {
      numero: '5',
      nombre: null,
      capacidad: 2,
      forma: 'cuadrada',
      areaId: null,
    });
  });

  it('al editar solo manda los campos que cambian', async () => {
    const patch = jest.fn().mockResolvedValue(undefined);

    await setup({ patch }).update(5, { capacity: 6, active: false });

    expect(patch).toHaveBeenCalledWith('mesas/admin/5', { capacidad: 6, activa: false });
  });

  it('devuelve lo que hizo el API con la baja', async () => {
    const del = jest.fn().mockResolvedValue({
      resultado: 'desactivada',
      message: 'La mesa tiene historial: se desactivó en lugar de borrarla.',
    });

    await expect(setup({ delete: del }).remove(5)).resolves.toEqual({
      result: 'desactivada',
      message: 'La mesa tiene historial: se desactivó en lugar de borrarla.',
    });
    expect(del).toHaveBeenCalledWith('mesas/admin/5');
  });

  it('propaga el error del API', async () => {
    const get = jest.fn().mockRejectedValue(new Error('Sin conexión'));
    await expect(setup({ get }).list()).rejects.toThrow('Sin conexión');
  });
});
