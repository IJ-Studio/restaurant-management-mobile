import { makeMenuRepository } from '../../__fixtures__/menu';
import { GetDishUseCase } from '../usecases/GetDishUseCase';

describe('GetDishUseCase', () => {
  it('devuelve el platillo pedido', async () => {
    await expect(new GetDishUseCase(makeMenuRepository()).execute(3)).resolves.toMatchObject({
      name: 'Chile en nogada',
    });
  });

  it.each([0, -1, 1.5, Number.NaN])('rechaza el id %p sin llamar al API', async (id) => {
    const repository = makeMenuRepository();

    await expect(new GetDishUseCase(repository).execute(id)).rejects.toMatchObject({ kind: 'validation' });
    expect(repository.getDish).not.toHaveBeenCalled();
  });
});
