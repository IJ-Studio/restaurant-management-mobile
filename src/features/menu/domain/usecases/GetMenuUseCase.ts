import type { MenuCategory } from '../entities/Dish';
import type { MenuRepository } from '../repositories/MenuRepository';

export class GetMenuUseCase {
  constructor(private readonly repository: MenuRepository) {}

  /** Menú para tomar pedidos: sin categorías vacías y con los platillos agotados al final. */
  async execute(): Promise<MenuCategory[]> {
    const categories = await this.repository.getMenu();
    return categories
      .filter((category) => category.dishes.length > 0)
      .map((category) => ({
        ...category,
        dishes: [...category.dishes].sort((a, b) => Number(b.available) - Number(a.available)),
      }));
  }
}
