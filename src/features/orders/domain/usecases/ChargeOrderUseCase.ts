import { AppError } from '../../../../core/errors/AppError';
import {
  validateCharge,
  type ChargeReceipt,
  type ChargeRequest,
  type PaymentMethod,
} from '../entities/Payment';
import type { OrderRepository } from '../repositories/OrderRepository';

/**
 * Cobro en caja. Valida antes de mandar (método, propina y que el efectivo alcance) para no
 * depender del API para errores obvios; el total real lo vuelve a calcular el servidor.
 */
export class ChargeOrderUseCase {
  constructor(private readonly repository: OrderRepository) {}

  async execute(
    order: { id: string; remaining: number },
    method: PaymentMethod | undefined,
    request: Omit<ChargeRequest, 'methodId'>,
  ): Promise<ChargeReceipt> {
    const full: ChargeRequest = { ...request, methodId: method?.id ?? 0 };
    const amount = request.amount ?? order.remaining;
    if (amount > order.remaining + 0.001) {
      throw new AppError(
        'validation',
        `El monto excede lo que falta por cobrar ($${order.remaining.toFixed(2)}).`,
      );
    }
    const problem = validateCharge(amount, full, method);
    if (problem) throw new AppError('validation', problem);
    return this.repository.charge(order.id, {
      ...full,
      // Si es todo lo que falta, no se manda monto: el API cobra el resto exacto.
      amount: request.amount !== undefined && amount < order.remaining ? amount : undefined,
      tip: method?.allowsTip === false ? 0 : full.tip,
      received: method?.kind === 'cash' ? full.received : undefined,
    });
  }
}
