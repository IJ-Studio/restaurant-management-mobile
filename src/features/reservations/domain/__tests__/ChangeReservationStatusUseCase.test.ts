import { ChangeReservationStatusUseCase, REASON_REQUIRED } from '../usecases/ChangeReservationStatusUseCase';

function setup() {
  const repository = { changeStatus: jest.fn().mockResolvedValue(undefined) };
  return { repository, useCase: new ChangeReservationStatusUseCase(repository) };
}

describe('ChangeReservationStatusUseCase', () => {
  it('confirma sin pedir motivo', async () => {
    const { useCase, repository } = setup();

    await useCase.execute('r-1', 'confirmada', 'ignorado');

    expect(repository.changeStatus).toHaveBeenCalledWith('r-1', 'confirmada', undefined);
  });

  it('cancelar exige motivo de al menos 3 letras y no llama al API sin él', async () => {
    const { useCase, repository } = setup();

    await expect(useCase.execute('r-1', 'cancelada', '  no ')).rejects.toThrow(REASON_REQUIRED);
    expect(repository.changeStatus).not.toHaveBeenCalled();
  });

  it('cancela con el motivo sin espacios de más', async () => {
    const { useCase, repository } = setup();

    await useCase.execute('r-1', 'cancelada', '  El cliente llamó  ');

    expect(repository.changeStatus).toHaveBeenCalledWith('r-1', 'cancelada', 'El cliente llamó');
  });

  it('rechaza un motivo de más de 300 caracteres', async () => {
    const { useCase } = setup();

    await expect(useCase.execute('r-1', 'cancelada', 'x'.repeat(301))).rejects.toThrow('hasta 300');
  });
});
