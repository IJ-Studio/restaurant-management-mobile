import type { Dish, DishTag } from '../../domain/entities/Dish';

export const TAG_LABEL: Record<DishTag, string> = {
  vegetariano: 'Vegetariano',
  vegano: 'Vegano',
  'sin-gluten': 'Sin gluten',
  picante: 'Picante',
  popular: 'Popular',
  nuevo: 'Nuevo',
  'del-chef': 'Del chef',
};

export function dishSubtitle(dish: Dish): string {
  return dish.shortDescription || dish.description;
}
