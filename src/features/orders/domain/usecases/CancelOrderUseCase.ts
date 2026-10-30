import type { OrderRepository } from '../repositories/OrderRepository';

/** Cancela un pedido en cocina (el API solo lo permite en sus primeros 2 minutos). */
export class CancelOrderUseCase {
  constructor(private readonly repository: OrderRepository) {}

  execute(orderId: string): Promise<string> {
    return this.repository.cancel(orderId);
  }
}
