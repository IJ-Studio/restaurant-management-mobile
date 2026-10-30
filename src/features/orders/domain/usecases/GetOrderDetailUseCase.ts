import type { OrderDetail } from '../entities/ActiveOrder';
import type { OrderRepository } from '../repositories/OrderRepository';

/** Detalle de un pedido con sus platillos. */
export class GetOrderDetailUseCase {
  constructor(private readonly repository: OrderRepository) {}

  execute(orderId: string): Promise<OrderDetail> {
    return this.repository.getDetail(orderId);
  }
}
