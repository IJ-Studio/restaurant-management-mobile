import { AppError } from '../../../../core/errors/AppError';
import type { HttpClient } from '../../../../core/http/httpClient';
import { makeCategoryDto, makeDishDto } from '../../__fixtures__/menuDto';
import { MenuRemoteDataSource } from '../datasources/MenuRemoteDataSource';
import { MenuRepositoryImpl } from '../repositories/MenuRepositoryImpl';

function setup(get: jest.Mock) {
  const http = { get } as unknown as HttpClient;
  return new MenuRepositoryImpl(new MenuRemoteDataSource(http));
}

describe('MenuRepositoryImpl', () => {
  it('consulta las categorías con productos y las mapea', async () => {
    const get = jest.fn().mockResolvedValue([makeCategoryDto()]);
    const menu = await setup(get).getMenu();

    expect(get).toHaveBeenCalledWith('menu/categories/with-products');
    expect(menu[0].dishes[0]).toMatchObject({ name: 'Enchiladas suizas', price: 145.5 });
  });

  it('consulta el detalle de un platillo', async () => {
    const get = jest.fn().mockResolvedValue(makeDishDto({ id: 7 }));
    await expect(setup(get).getDish(7)).resolves.toMatchObject({ id: 7 });
    expect(get).toHaveBeenCalledWith('menu/items/7');
  });

  it('traduce un 404 a un mensaje para el mesero', async () => {
    const get = jest
      .fn()
      .mockRejectedValue(new AppError('not-found', 'El platillo con ID 7 no existe.', 404));
    await expect(setup(get).getDish(7)).rejects.toThrow('Este platillo ya no está en el menú.');
  });

  it('deja pasar otros errores', async () => {
    const error = new AppError('network', 'No hay conexión con el servidor.');
    await expect(setup(jest.fn().mockRejectedValue(error)).getDish(7)).rejects.toBe(error);
  });
});
