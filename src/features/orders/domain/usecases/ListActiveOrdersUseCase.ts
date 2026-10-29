import type { ActiveOrder } from '../entities/ActiveOrder';
import type { OrderRepository } from '../repositories/OrderRepository';

/** Pedidos activos del día, en el orden del API (el más reciente primero). */
export class ListActiveOrdersUseCase {
  constructor(private readonly repository: OrderRepository) {}

  execute(): Promise<ActiveOrder[]> {
    return this.repository.listActive();
  }
}
