import type { Dish } from '../entities/Dish';
import type { MenuRepository } from '../repositories/MenuRepository';

export class GetDishUseCase {
  constructor(private readonly repository: MenuRepository) {}

  execute(id: string): Promise<Dish> {
    return this.repository.getDish(id);
  }
}
