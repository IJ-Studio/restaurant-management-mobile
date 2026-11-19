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

  async updateDish(id: number, changes: { available?: boolean; price?: number }): Promise<void> {
    try {
      await this.remote.updateDish(id, {
        ...(changes.available !== undefined ? { disponible: changes.available } : {}),
        ...(changes.price !== undefined ? { precio: changes.price } : {}),
      });
    } catch (error) {
      if (error instanceof AppError && error.kind === 'forbidden') {
        throw new AppError('forbidden', 'Solo el administrador puede cambiar la carta.', error.status);
      }
      throw error;
    }
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
