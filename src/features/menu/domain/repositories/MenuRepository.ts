import type { Dish } from '../entities/Dish';

export interface MenuRepository {
  getMenu(): Promise<Dish[]>;
  getDish(id: string): Promise<Dish>;
}
