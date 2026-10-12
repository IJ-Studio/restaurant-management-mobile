import type { Dish } from '../entities/Dish';
import type { MenuRepository } from '../repositories/MenuRepository';

/** Menú para tomar pedidos: primero lo disponible, luego lo agotado; dentro de cada grupo, por nombre. */
export class GetMenuUseCase {
  constructor(private readonly repository: MenuRepository) {}

  async execute(): Promise<Dish[]> {
    const dishes = await this.repository.getMenu();
    return [...dishes].sort(
      (a, b) => Number(b.available) - Number(a.available) || a.name.localeCompare(b.name, 'es'),
    );
  }
}
