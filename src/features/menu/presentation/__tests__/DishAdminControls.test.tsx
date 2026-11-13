import { fireEvent, screen } from '@testing-library/react-native';

import { AppError } from '../../../../core/errors/AppError';
import { makeTestDependencies } from '../../../../core/testing/makeTestDependencies';
import { renderWithProviders } from '../../../../core/testing/renderWithProviders';
import { makeDish } from '../../__fixtures__/menu';
import { DishAdminControls } from '../components/DishAdminControls';

function setup(overrides: { setAvailable?: jest.Mock; setPrice?: jest.Mock } = {}) {
  const updateDishUseCase = {
    setAvailable: overrides.setAvailable ?? jest.fn().mockResolvedValue(undefined),
    setPrice: overrides.setPrice ?? jest.fn().mockResolvedValue(undefined),
  };
  return { deps: makeTestDependencies({ updateDishUseCase }), updateDishUseCase };
}

describe('DishAdminControls', () => {
  it('agota el platillo al momento', async () => {
    const { deps, updateDishUseCase } = setup();
    await renderWithProviders(<DishAdminControls dish={makeDish({ id: 4, available: true })} />, deps);

    await fireEvent(screen.getByRole('switch', { name: 'Disponible para pedir' }), 'valueChange', false);

    expect(updateDishUseCase.setAvailable).toHaveBeenCalledWith(4, false);
    expect(await screen.findByText('Marcado como agotado: ya no se puede pedir.')).toBeOnTheScreen();
  });

  it('guarda el precio nuevo y solo se habilita si cambió', async () => {
    const { deps, updateDishUseCase } = setup();
    await renderWithProviders(<DishAdminControls dish={makeDish({ id: 4, price: 145.5 })} />, deps);
    expect(screen.getByRole('button', { name: 'Guardar precio' })).toBeDisabled();

    await fireEvent.changeText(screen.getByLabelText('Precio ($)'), '$150.00');
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar precio' }));

    expect(updateDishUseCase.setPrice).toHaveBeenCalledWith(4, 150);
    expect(await screen.findByText('Precio guardado.')).toBeOnTheScreen();
  });

  it('muestra el motivo si no se pudo guardar', async () => {
    const { deps } = setup({
      setPrice: jest
        .fn()
        .mockRejectedValue(
          new AppError('validation', 'Escribe un precio mayor que $0 y de hasta $99,999.99.'),
        ),
    });
    await renderWithProviders(<DishAdminControls dish={makeDish({ id: 4, price: 145.5 })} />, deps);

    await fireEvent.changeText(screen.getByLabelText('Precio ($)'), '0');
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar precio' }));

    expect(
      await screen.findByText('Escribe un precio mayor que $0 y de hasta $99,999.99.'),
    ).toBeOnTheScreen();
  });
});
