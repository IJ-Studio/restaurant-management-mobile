import type { MenuCategory } from './Dish';

/** Quita acentos y mayúsculas para buscar "cafe" y encontrar "Café". */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** Filtra platillos por nombre o descripción y descarta las categorías que quedan vacías. */
export function filterMenu(categories: MenuCategory[], query: string): MenuCategory[] {
  const term = normalize(query);
  if (!term) return categories;

  return categories
    .map((category) => ({
      ...category,
      dishes: category.dishes.filter((dish) =>
        normalize(`${dish.name} ${dish.shortDescription ?? ''} ${dish.description}`).includes(term),
      ),
    }))
    .filter((category) => category.dishes.length > 0);
}
