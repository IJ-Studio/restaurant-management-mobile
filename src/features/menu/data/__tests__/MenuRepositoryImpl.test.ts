import type { HttpClient } from '../../../../core/http/httpClient';
import { MenuRemoteDataSource } from '../datasources/MenuRemoteDataSource';
import { MenuRepositoryImpl } from '../repositories/MenuRepositoryImpl';

function setup() {
  const http = { get: jest.fn() } as unknown as jest.Mocked<HttpClient>;
  return { http, repository: new MenuRepositoryImpl(new MenuRemoteDataSource(http)) };
}

describe('MenuRepositoryImpl', () => {
  it('lee el menú de GET /menu y lo mapea', async () => {
    const { http, repository } = setup();
    http.get.mockResolvedValue([{ id: 1, nombre: 'Pozole', precio: '120.00' }]);

    const menu = await repository.getMenu();

    expect(http.get).toHaveBeenCalledWith('menu');
    expect(menu).toHaveLength(1);
    expect(menu[0]).toMatchObject({ id: '1', name: 'Pozole', price: 120 });
  });

  it('rechaza una respuesta que no es lista', async () => {
    const { http, repository } = setup();
    http.get.mockResolvedValue({ error: 'x' });
    await expect(repository.getMenu()).rejects.toMatchObject({ kind: 'server' });
  });

  it('lee el detalle de GET /menu/items/:id con el id escapado', async () => {
    const { http, repository } = setup();
    http.get.mockResolvedValue({ id: 7, nombre: 'Flan', precio: '45' });

    await expect(repository.getDish('7')).resolves.toMatchObject({ id: '7', name: 'Flan' });
    await repository.getDish('../users').catch(() => {});
    expect(http.get).toHaveBeenLastCalledWith('menu/items/..%2Fusers');
  });

  it('reporta "no encontrado" si el detalle viene vacío', async () => {
    const { http, repository } = setup();
    http.get.mockResolvedValue(undefined);
    await expect(repository.getDish('1')).rejects.toMatchObject({ kind: 'not-found' });
  });
});
