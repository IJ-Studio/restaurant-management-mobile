import { PRICE_INVALID, UpdateDishUseCase } from '../usecases/UpdateDishUseCase';

function setup() {
  const repository = { updateDish: jest.fn().mockResolvedValue(undefined) };
  return { repository, useCase: new UpdateDishUseCase(repository) };
}

describe('UpdateDishUseCase', () => {
  it('marca un platillo como agotado', async () => {
    const { useCase, repository } = setup();

    await useCase.setAvailable(4, false);

    expect(repository.updateDish).toHaveBeenCalledWith(4, { available: false });
  });

  it('guarda un precio válido con dos decimales', async () => {
    const { useCase, repository } = setup();

    await useCase.setPrice(4, 145.5);

    expect(repository.updateDish).toHaveBeenCalledWith(4, { price: 145.5 });
  });

  it.each([0, -10, 100000, Number.NaN, 12.345])('rechaza el precio %p sin llamar al API', async (price) => {
    const { useCase, repository } = setup();

    await expect(useCase.setPrice(4, price)).rejects.toThrow(PRICE_INVALID);
    expect(repository.updateDish).not.toHaveBeenCalled();
  });
});
