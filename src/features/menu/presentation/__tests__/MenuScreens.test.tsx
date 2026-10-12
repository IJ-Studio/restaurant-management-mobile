import { NavigationContainer } from '@react-navigation/native';
import { QueryClient } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';

import type { Dependencies } from '../../../../core/di/dependencies';
import { AppError } from '../../../../core/errors/AppError';
import { AppProviders } from '../../../../core/providers/AppProviders';
import type { Dish } from '../../domain/entities/Dish';
import { MenuStack } from '../navigation/MenuStack';

const testQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });

const tags = {
  vegetarian: false,
  vegan: false,
  glutenFree: false,
  spicy: false,
  spicyLevel: 0,
  popular: false,
  isNew: false,
  chefSpecial: false,
};

const pozole: Dish = {
  id: '1',
  categoryId: '1',
  name: 'Pozole',
  description: 'Pozole rojo con pollo y tostadas.',
  shortDescription: 'Rojo, con pollo',
  imageUrl: 'https://cdn.resto.mx/pozole.jpg',
  price: 120,
  prepTimeMinutes: 15,
  available: true,
  tags: { ...tags, popular: true },
};

const ceviche: Dish = {
  ...pozole,
  id: '2',
  name: 'Ceviche',
  description: 'Ceviche de pescado.',
  shortDescription: 'De pescado',
  imageUrl: null,
  price: 145.5,
  available: false,
  tags: { ...tags, glutenFree: true },
};

async function renderMenu(getMenu: jest.Mock, getDish: jest.Mock = jest.fn().mockResolvedValue(pozole)) {
  const dependencies = {
    getMenuUseCase: { execute: getMenu },
    getDishUseCase: { execute: getDish },
  } as unknown as Dependencies;
  await render(
    <AppProviders dependencies={dependencies} queryClient={testQueryClient()}>
      <NavigationContainer>
        <MenuStack />
      </NavigationContainer>
    </AppProviders>,
  );
  return { getMenu, getDish };
}

describe('MenuScreen', () => {
  it('muestra el estado de carga', async () => {
    await renderMenu(jest.fn(() => new Promise(() => {})));
    expect(screen.getByLabelText('Cargando menú')).toBeOnTheScreen();
  });

  it('lista los platillos con precio, imagen y disponibilidad', async () => {
    await renderMenu(jest.fn().mockResolvedValue([pozole, ceviche]));

    expect(await screen.findByText('Pozole')).toBeOnTheScreen();
    expect(screen.getByText('$120.00')).toBeOnTheScreen();
    expect(screen.getByText('$145.50')).toBeOnTheScreen();
    expect(screen.getByText('Popular')).toBeOnTheScreen();
    expect(screen.getByText('Agotado')).toBeOnTheScreen();
    expect(screen.getByLabelText('Ceviche, $145.50, agotado')).toBeOnTheScreen();
  });

  it('muestra el error y permite reintentar', async () => {
    const getMenu = jest
      .fn()
      .mockRejectedValueOnce(new AppError('network', 'No hay conexión con el servidor.'))
      .mockResolvedValue([pozole]);
    await renderMenu(getMenu);

    expect(await screen.findByRole('alert')).toHaveTextContent('No hay conexión con el servidor.');
    await fireEvent.press(screen.getByText('Reintentar'));

    expect(await screen.findByText('Pozole')).toBeOnTheScreen();
    expect(getMenu).toHaveBeenCalledTimes(2);
  });

  it('avisa si el menú está vacío', async () => {
    await renderMenu(jest.fn().mockResolvedValue([]));
    expect(await screen.findByText('No hay platillos en el menú.')).toBeOnTheScreen();
  });
});

describe('DishDetailScreen', () => {
  it('al tocar un platillo muestra su información completa', async () => {
    const { getDish } = await renderMenu(jest.fn().mockResolvedValue([pozole]));

    await fireEvent.press(await screen.findByLabelText('Pozole, $120.00'));

    expect(await screen.findByText('Pozole rojo con pollo y tostadas.')).toBeOnTheScreen();
    expect(screen.getByText('Disponible')).toBeOnTheScreen();
    expect(screen.getByText('Tiempo de preparación: 15 min')).toBeOnTheScreen();
    expect(screen.getByLabelText('Foto de Pozole')).toBeOnTheScreen();
    expect(getDish).toHaveBeenCalledWith('1');
  });

  it('muestra el detalle de la lista aunque el API del detalle falle', async () => {
    await renderMenu(
      jest.fn().mockResolvedValue([ceviche]),
      jest.fn().mockRejectedValue(new AppError('network', 'sin red')),
    );

    await fireEvent.press(await screen.findByLabelText('Ceviche, $145.50, agotado'));

    expect(await screen.findByText('Ceviche de pescado.')).toBeOnTheScreen();
    expect(screen.getAllByText('Agotado').length).toBeGreaterThan(0);
    expect(screen.getByText('Sin gluten')).toBeOnTheScreen();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('DishDetailScreen sin datos de la lista', () => {
  it('muestra el error del detalle si no hay nada que mostrar', async () => {
    const getMenu = jest.fn().mockResolvedValue([{ ...pozole, id: '1' }]);
    const getDish = jest.fn().mockRejectedValue(new AppError('not-found', 'No se encontró el platillo.', 404));
    const dependencies = {
      getMenuUseCase: { execute: getMenu },
      getDishUseCase: { execute: getDish },
    } as unknown as Dependencies;
    await render(
      <AppProviders dependencies={dependencies} queryClient={testQueryClient()}>
        <NavigationContainer
          initialState={{ routes: [{ name: 'MenuList' }, { name: 'DishDetail', params: { id: '99' } }] }}
        >
          <MenuStack />
        </NavigationContainer>
      </AppProviders>,
    );

    expect(await screen.findByText('No se encontró el platillo.')).toBeOnTheScreen();
  });
});
