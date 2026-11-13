import { AppError } from '../../../../core/errors/AppError';
import type { HttpClient } from '../../../../core/http/httpClient';
import { MenuRemoteDataSource } from '../datasources/MenuRemoteDataSource';
import { MenuRepositoryImpl } from '../repositories/MenuRepositoryImpl';

const setup = (patch: jest.Mock) =>
  new MenuRepositoryImpl(new MenuRemoteDataSource({ patch } as unknown as HttpClient));

describe('MenuRepositoryImpl.updateDish', () => {
  it('manda solo los campos que cambian, con los nombres del API', async () => {
    const patch = jest.fn().mockResolvedValue({});

    await setup(patch).updateDish(4, { available: false });
    await setup(patch).updateDish(4, { price: 150 });

    expect(patch).toHaveBeenNthCalledWith(1, 'platillos/4', { disponible: false });
    expect(patch).toHaveBeenNthCalledWith(2, 'platillos/4', { precio: 150 });
  });

  it('explica un 403 y deja pasar otros errores', async () => {
    await expect(
      setup(jest.fn().mockRejectedValue(new AppError('forbidden', 'Forbidden resource', 403))).updateDish(4, {
        available: true,
      }),
    ).rejects.toThrow('Solo el administrador puede cambiar la carta.');
    const offline = new AppError('network', 'Sin conexión');
    await expect(setup(jest.fn().mockRejectedValue(offline)).updateDish(4, { price: 1 })).rejects.toBe(
      offline,
    );
  });
});
