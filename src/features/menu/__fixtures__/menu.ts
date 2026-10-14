import type { Dish, MenuCategory } from '../domain/entities/Dish';
import type { MenuRepository } from '../domain/repositories/MenuRepository';

export function makeDish(overrides: Partial<Dish> = {}): Dish {
  return {
    id: 1,
    categoryId: 10,
    name: 'Enchiladas suizas',
    description: 'Tortillas rellenas de pollo bañadas en salsa verde con crema y queso gratinado.',
    shortDescription: 'Pollo, salsa verde y queso',
    imageUrl: 'https://cdn.quijote.mx/enchiladas.jpg',
    price: 145.5,
    prepTimeMinutes: 15,
    available: true,
    tags: ['popular'],
    ...overrides,
  };
}

export function makeMenu(): MenuCategory[] {
  return [
    {
      id: 10,
      name: 'Platos fuertes',
      dishes: [
        makeDish(),
        makeDish({ id: 2, name: 'Mole poblano', available: false, tags: ['del-chef'] }),
        makeDish({ id: 3, name: 'Chile en nogada', tags: ['nuevo'] }),
      ],
    },
    {
      id: 20,
      name: 'Bebidas',
      dishes: [
        makeDish({
          id: 4,
          categoryId: 20,
          name: 'Café de olla',
          description: 'Con piloncillo y canela.',
          price: 45,
        }),
      ],
    },
  ];
}

export function makeMenuRepository(menu: MenuCategory[] = makeMenu()): jest.Mocked<MenuRepository> {
  return {
    getMenu: jest.fn().mockResolvedValue(menu),
    getDish: jest.fn().mockImplementation(async (id: number) => {
      const dish = menu.flatMap((c) => c.dishes).find((d) => d.id === id);
      if (!dish) throw new Error('not found');
      return dish;
    }),
  };
}
