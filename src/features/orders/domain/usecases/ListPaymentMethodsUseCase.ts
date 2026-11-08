import type { PaymentMethod } from '../entities/Payment';
import type { OrderRepository } from '../repositories/OrderRepository';

const ORDER: Record<PaymentMethod['kind'], number> = { cash: 0, card: 1, digital: 2, other: 3 };

/** Métodos de cobro en caja: primero efectivo, luego tarjeta y pagos digitales. */
export class ListPaymentMethodsUseCase {
  constructor(private readonly repository: OrderRepository) {}

  async execute(): Promise<PaymentMethod[]> {
    const methods = await this.repository.listPaymentMethods();
    return [...methods].sort((a, b) => ORDER[a.kind] - ORDER[b.kind] || a.id - b.id);
  }
}
