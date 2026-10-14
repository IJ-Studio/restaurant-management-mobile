import { AppError } from '../../../../core/errors/AppError';
import type { Dish } from '../entities/Dish';
import type { MenuRepository } from '../repositories/MenuRepository';

export class GetDishUseCase {
  constructor(private readonly repository: MenuRepository) {}

  execute(id: number): Promise<Dish> {
    if (!Number.isInteger(id) || id <= 0) {
      return Promise.reject(new AppError('validation', 'Platillo inválido.'));
    }
    return this.repository.getDish(id);
  }
}
