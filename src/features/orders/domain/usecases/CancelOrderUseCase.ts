import type { OrderRepository } from '../repositories/OrderRepository';

/** Cancela un pedido en cocina (el API solo lo permite en sus primeros 2 minutos). */
export class CancelOrderUseCase {
  constructor(private readonly repository: OrderRepository) {}

  /** El motivo es obligatorio: sin él ni siquiera se llama al API. */
  async execute(orderId: string, reason: string): Promise<string> {
    const motivo = reason.trim();
    if (motivo.length < 3) throw new Error('Escribe el motivo de la cancelación.');
    return this.repository.cancel(orderId, motivo);
  }
}
