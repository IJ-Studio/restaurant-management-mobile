import { AppError } from '../../../../core/errors/AppError';
import type { OrderDetail } from '../entities/ActiveOrder';
import type { OrderRepository } from '../repositories/OrderRepository';

/** Detalle de un pedido de mesa con sus platillos. */
export class GetOrderDetailUseCase {
  constructor(private readonly repository: OrderRepository) {}

  async execute(tableNumber: string, orderId: string): Promise<OrderDetail> {
    if (!tableNumber) throw new AppError('validation', 'Este pedido no tiene mesa.');
    return this.repository.getDetail(tableNumber, orderId);
  }
}
