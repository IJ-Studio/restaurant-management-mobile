import { AppError } from '../../../../core/errors/AppError';
import type { CardPaymentOutcome, PaymentGateway } from '../ports/PaymentGateway';
import type { OrderRepository } from '../repositories/OrderRepository';

export const PARTIAL_NOT_ALLOWED =
  'Este pedido ya tiene pagos en caja. Cobra lo que falta en caja: la tarjeta en la app cobra la cuenta completa.';
export const NOTHING_TO_CHARGE = 'Este pedido no tiene nada pendiente por cobrar.';
export const NOT_CONFIRMED =
  'Stripe aceptó el pago, pero el pedido aún no aparece como pagado. Revisa la lista de cobros en unos segundos.';

export type CheckoutResult = CardPaymentOutcome | { status: 'pending'; message: string };

interface Options {
  /** Cuántas veces se revisa el pedido después de pagar (el API lo marca al recibir el webhook). */
  attempts?: number;
  wait?: (ms: number) => Promise<void>;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Facade del cobro con tarjeta (HU-05, #338): un solo `execute` encadena intención en el API →
 * pago en Stripe → confirmación del servidor. La app nunca decide el monto ni da el pedido por
 * pagado: eso lo hace el API cuando Stripe le avisa (webhook).
 */
export class CheckoutUseCase {
  private readonly attempts: number;
  private readonly wait: (ms: number) => Promise<void>;

  constructor(
    private readonly repository: Pick<OrderRepository, 'createCardIntent' | 'getDetail'>,
    private readonly gateway: PaymentGateway,
    { attempts = 10, wait = sleep }: Options = {},
  ) {
    this.attempts = attempts;
    this.wait = wait;
  }

  isAvailable(): boolean {
    return this.gateway.isAvailable();
  }

  async execute(order: { id: string; remaining: number; paymentsCount: number }): Promise<CheckoutResult> {
    if (order.remaining <= 0) throw new AppError('validation', NOTHING_TO_CHARGE);
    if (order.paymentsCount > 0) throw new AppError('validation', PARTIAL_NOT_ALLOWED);

    const intent = await this.repository.createCardIntent(order.id);
    const outcome = await this.gateway.pay(intent);
    if (outcome.status !== 'paid') return outcome;

    for (let i = 0; i < this.attempts; i += 1) {
      const detail = await this.repository.getDetail(order.id);
      if (detail.status === 'pagada' || detail.remaining <= 0) return outcome;
      await this.wait(1500);
    }
    return { status: 'pending', message: NOT_CONFIRMED };
  }
}
