import { makeMenu, makeMenuRepository } from '../../__fixtures__/menu';
import { GetMenuUseCase } from '../usecases/GetMenuUseCase';

describe('GetMenuUseCase', () => {
  it('devuelve las categorías con los platillos agotados al final', async () => {
    const menu = await new GetMenuUseCase(makeMenuRepository()).execute();

    expect(menu.map((c) => c.name)).toEqual(['Platos fuertes', 'Bebidas']);
    expect(menu[0].dishes.map((d) => d.name)).toEqual([
      'Enchiladas suizas',
      'Chile en nogada',
      'Mole poblano',
    ]);
  });

  it('descarta categorías sin platillos', async () => {
    const repository = makeMenuRepository([...makeMenu(), { id: 30, name: 'Postres', dishes: [] }]);
    const menu = await new GetMenuUseCase(repository).execute();

    expect(menu.map((c) => c.name)).not.toContain('Postres');
  });

  it('no modifica el arreglo que devuelve el repositorio', async () => {
    const source = makeMenu();
    await new GetMenuUseCase(makeMenuRepository(source)).execute();

    expect(source[0].dishes.map((d) => d.id)).toEqual([1, 2, 3]);
  });

  it('propaga el error del repositorio', async () => {
    const repository = makeMenuRepository();
    repository.getMenu.mockRejectedValue(new Error('sin red'));

    await expect(new GetMenuUseCase(repository).execute()).rejects.toThrow('sin red');
  });
});
