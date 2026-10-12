import { AppError } from '../../../../core/errors/AppError';
import type { Dish } from '../../domain/entities/Dish';
import type { MenuRepository } from '../../domain/repositories/MenuRepository';
import type { MenuRemoteDataSource } from '../datasources/MenuRemoteDataSource';
import { toDish } from '../mappers/dishMapper';

export class MenuRepositoryImpl implements MenuRepository {
  constructor(private readonly remote: MenuRemoteDataSource) {}

  async getMenu(): Promise<Dish[]> {
    const dtos = await this.remote.getMenu();
    if (!Array.isArray(dtos)) throw new AppError('server', 'Respuesta del menú inválida.');
    return dtos.map(toDish);
  }

  async getDish(id: string): Promise<Dish> {
    const dto = await this.remote.getDish(id);
    if (!dto || typeof dto !== 'object') throw new AppError('not-found', 'No se encontró el platillo.', 404);
    return toDish(dto);
  }
}
