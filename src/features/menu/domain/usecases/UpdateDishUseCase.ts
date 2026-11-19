import { AppError } from '../../../../core/errors/AppError';
import type { MenuRepository } from '../repositories/MenuRepository';

export const PRICE_INVALID = 'Escribe un precio mayor que $0 y de hasta $99,999.99.';

/** Cambios rápidos de la carta desde la móvil (administrador): disponibilidad y precio. */
export class UpdateDishUseCase {
  constructor(private readonly repository: Pick<MenuRepository, 'updateDish'>) {}

  setAvailable(id: number, available: boolean): Promise<void> {
    return this.repository.updateDish(id, { available });
  }

  async setPrice(id: number, price: number): Promise<void> {
    const cents = Math.round(price * 100);
    if (!Number.isFinite(price) || cents <= 0 || cents > 9_999_999 || Math.abs(price * 100 - cents) > 1e-6) {
      throw new AppError('validation', PRICE_INVALID);
    }
    await this.repository.updateDish(id, { price: cents / 100 });
  }
}
