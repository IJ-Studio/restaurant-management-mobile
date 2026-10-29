import type { OrderRepository } from '../repositories/OrderRepository';

/** Quita un platillo de un pedido que sigue pendiente. */
export class RemoveOrderItemUseCase {
  constructor(private readonly repository: OrderRepository) {}

  execute(itemId: number): Promise<string> {
    return this.repository.removeItem(itemId);
  }
}
