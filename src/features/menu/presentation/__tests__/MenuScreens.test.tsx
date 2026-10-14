import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { AppError } from '../../../../core/errors/AppError';
import { makeTestDependencies } from '../../../../core/testing/makeTestDependencies';
import { renderWithProviders } from '../../../../core/testing/renderWithProviders';
import { makeDish, makeMenu } from '../../__fixtures__/menu';
import { MenuNavigator } from '../navigation/MenuNavigator';

function renderMenu(
  deps = makeTestDependencies({ getMenuUseCase: { execute: jest.fn().mockResolvedValue(makeMenu()) } }),
) {
  return renderWithProviders(
    <NavigationContainer>
      <MenuNavigator />
    </NavigationContainer>,
    deps,
  );
}

describe('Pantallas del menú', () => {
  it('lista los platillos por categoría con imagen, precio y disponibilidad', async () => {
    await renderMenu();

    expect(await screen.findByText('Platos fuertes')).toBeOnTheScreen();
    expect(screen.getByText('Bebidas')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Enchiladas suizas, $145.50' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Mole poblano, Agotado, $145.50' })).toBeOnTheScreen();
  });

  it('busca platillos y avisa cuando no hay resultados', async () => {
    await renderMenu();
    await screen.findByText('Platos fuertes');

    await fireEvent.changeText(screen.getByLabelText('Buscar platillo'), 'cafe');
    expect(screen.getByText('Café de olla')).toBeOnTheScreen();
    expect(screen.queryByText('Enchiladas suizas')).toBeNull();

    await fireEvent.changeText(screen.getByLabelText('Buscar platillo'), 'pizza');
    expect(screen.getByText('Sin resultados para "pizza".')).toBeOnTheScreen();
  });

  it('muestra el error y permite reintentar', async () => {
    const execute = jest
      .fn()
      .mockRejectedValueOnce(new AppError('network', 'No hay conexión con el servidor.'))
      .mockResolvedValue(makeMenu());
    await renderMenu(makeTestDependencies({ getMenuUseCase: { execute } }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No hay conexión con el servidor.');
    await fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('Platos fuertes')).toBeOnTheScreen();
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it('abre el detalle con la información completa usando la caché del menú', async () => {
    const deps = makeTestDependencies({
      getMenuUseCase: { execute: jest.fn().mockResolvedValue(makeMenu()) },
    });
    await renderMenu(deps);

    await fireEvent.press(await screen.findByRole('button', { name: 'Enchiladas suizas, $145.50' }));

    expect(await screen.findByText(/Tortillas rellenas de pollo/)).toBeOnTheScreen();
    expect(screen.getByText('Disponible')).toBeOnTheScreen();
    expect(screen.getByText('Tiempo de preparación: 15 min')).toBeOnTheScreen();
    expect(screen.getByText('Popular')).toBeOnTheScreen();
    expect(deps.getDishUseCase.execute).not.toHaveBeenCalled();
  });

  it('el detalle consulta al API si el platillo no está en caché y muestra sus errores', async () => {
    const getDish = jest
      .fn()
      .mockRejectedValue(new AppError('not-found', 'Este platillo ya no está en el menú.'));
    const menu = [{ id: 1, name: 'Platos', dishes: [makeDish({ id: 99, name: 'Pozole' })] }];
    const deps = makeTestDependencies({
      getMenuUseCase: { execute: jest.fn().mockResolvedValue(menu) },
      getDishUseCase: { execute: getDish },
    });
    await renderMenu(deps);
    await screen.findByText('Pozole');

    // Simula que el menú en caché ya no tiene el platillo (p. ej. se refrescó).
    menu[0].dishes = [];
    await fireEvent.press(screen.getByRole('button', { name: 'Pozole, $145.50' }));

    await waitFor(() => expect(getDish).toHaveBeenCalledWith(99));
    expect(await screen.findByText('Este platillo ya no está en el menú.')).toBeOnTheScreen();
  });

  it('muestra nivel de picante y etiquetas en el detalle', async () => {
    const dish = makeDish({
      id: 5,
      name: 'Aguachile',
      tags: ['picante', 'sin-gluten'],
      spicyLevel: 4,
      available: false,
    });
    const deps = makeTestDependencies({
      getMenuUseCase: { execute: jest.fn().mockResolvedValue([{ id: 1, name: 'Mariscos', dishes: [dish] }]) },
    });
    await renderMenu(deps);

    await fireEvent.press(await screen.findByRole('button', { name: 'Aguachile, Agotado, $145.50' }));

    expect(await screen.findByText('Nivel de picante: 4/5')).toBeOnTheScreen();
    expect(screen.getByText('Sin gluten')).toBeOnTheScreen();
    expect(screen.getAllByText('Agotado').length).toBeGreaterThan(0);
  });
});
