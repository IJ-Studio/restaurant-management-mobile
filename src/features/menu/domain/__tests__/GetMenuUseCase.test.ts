import type { Dish } from '../entities/Dish';
import type { MenuRepository } from '../repositories/MenuRepository';
import { GetDishUseCase } from '../usecases/GetDishUseCase';
import { GetMenuUseCase } from '../usecases/GetMenuUseCase';

const dish = (id: string, name: string, available = true) => ({ id, name, available }) as Dish;

function repositoryWith(dishes: Dish[]): jest.Mocked<MenuRepository> {
  return { getMenu: jest.fn().mockResolvedValue(dishes), getDish: jest.fn().mockResolvedValue(dishes[0]) };
}

describe('GetMenuUseCase', () => {
  it('pone primero lo disponible y ordena por nombre', async () => {
    const repository = repositoryWith([
      dish('1', 'Tacos', false),
      dish('2', 'Enchiladas'),
      dish('3', 'Agua de jamaica'),
      dish('4', 'Ceviche', false),
    ]);
    const names = (await new GetMenuUseCase(repository).execute()).map((d) => d.name);
    expect(names).toEqual(['Agua de jamaica', 'Enchiladas', 'Ceviche', 'Tacos']);
  });

  it('no modifica la lista del repositorio', async () => {
    const original = [dish('1', 'B'), dish('2', 'A')];
    await new GetMenuUseCase(repositoryWith(original)).execute();
    expect(original.map((d) => d.name)).toEqual(['B', 'A']);
  });

  it('propaga el error del repositorio', async () => {
    const repository = repositoryWith([]);
    repository.getMenu.mockRejectedValue(new Error('sin red'));
    await expect(new GetMenuUseCase(repository).execute()).rejects.toThrow('sin red');
  });
});

describe('GetDishUseCase', () => {
  it('pide el platillo por id', async () => {
    const repository = repositoryWith([dish('9', 'Pozole')]);
    await expect(new GetDishUseCase(repository).execute('9')).resolves.toMatchObject({ name: 'Pozole' });
    expect(repository.getDish).toHaveBeenCalledWith('9');
  });
});
