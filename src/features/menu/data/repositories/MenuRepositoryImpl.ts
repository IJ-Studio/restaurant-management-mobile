import { AppError } from '../../../../core/errors/AppError';
import type { Dish, MenuCategory } from '../../domain/entities/Dish';
import type { MenuRepository } from '../../domain/repositories/MenuRepository';
import type { MenuRemoteDataSource } from '../datasources/MenuRemoteDataSource';
import { toDish, toMenu } from '../mappers/menuMapper';

export class MenuRepositoryImpl implements MenuRepository {
  constructor(private readonly remote: MenuRemoteDataSource) {}

  async getMenu(): Promise<MenuCategory[]> {
    return toMenu(await this.remote.getCategoriesWithDishes());
  }

  async getDish(id: number): Promise<Dish> {
    try {
      return toDish(await this.remote.getDish(id));
    } catch (error) {
      if (error instanceof AppError && error.kind === 'not-found') {
        throw new AppError('not-found', 'Este platillo ya no está en el menú.', error.status);
      }
      throw error;
    }
  }
}
