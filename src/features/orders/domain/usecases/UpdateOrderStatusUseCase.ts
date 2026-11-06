import type { OrderRepository, OrderStep } from '../repositories/OrderRepository';

/** Cocina: empezar a preparar o marcar listo. Piso: entregar en la mesa. */
export class UpdateOrderStatusUseCase {
  constructor(private readonly repository: OrderRepository) {}

  execute(orderId: string, step: OrderStep): Promise<string> {
    return this.repository.updateStatus(orderId, step);
  }
}
