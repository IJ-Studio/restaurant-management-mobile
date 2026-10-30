import { AppError } from '../../../../core/errors/AppError';
import type { TableOrder } from '../entities/TableOrder';
import type { OrderRepository, SentOrder } from '../repositories/OrderRepository';

/** Facade del envío: valida el pedido, lo registra en la mesa y lo manda a cocina en una sola operación. */
export class SendOrderToKitchenUseCase {
  constructor(private readonly repository: OrderRepository) {}

  async execute(order: TableOrder, waiterId: number): Promise<SentOrder> {
    if (!order.tableNumber) throw new AppError('validation', 'Elige la mesa.');
    if (order.lines.length === 0) throw new AppError('validation', 'Agrega al menos un platillo.');
    if (!Number.isInteger(waiterId) || waiterId <= 0)
      throw new AppError('unauthorized', 'Vuelve a iniciar sesión.');

    const orderId = await this.repository.createTableOrder(waiterId, order.tableNumber, order.lines, {
      guests: order.guests,
      kitchenNote: order.kitchenNote?.trim() || undefined,
    });
    return this.repository.confirm(orderId);
  }
}
