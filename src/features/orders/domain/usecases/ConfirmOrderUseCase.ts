import type { OrderRepository, SentOrder } from '../repositories/OrderRepository';

/** Manda a cocina un pedido de mesa que estaba pendiente. */
export class ConfirmOrderUseCase {
  constructor(private readonly repository: OrderRepository) {}

  execute(orderId: string): Promise<SentOrder> {
    return this.repository.confirm(orderId);
  }
}
