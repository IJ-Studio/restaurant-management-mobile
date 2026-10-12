import type { Dish, MenuCategory } from '../entities/Dish';

export interface MenuRepository {
  /** Categorías activas, en el orden del menú, con sus platillos. */
  getMenu(): Promise<MenuCategory[]>;
  getDish(id: number): Promise<Dish>;
}
