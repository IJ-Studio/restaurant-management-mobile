import { initPaymentSheet, initStripe, presentPaymentSheet } from '@stripe/stripe-react-native';

import type {
  CardPaymentIntent,
  CardPaymentOutcome,
  PaymentGateway,
} from '../../domain/ports/PaymentGateway';

export const MERCHANT_NAME = 'Restaurante El Quijote';
const DECLINED = 'No se pudo cobrar con la tarjeta. Pide otra tarjeta o cobra en caja.';

/**
 * Adapter de Stripe (PaymentSheet) al puerto `PaymentGateway` (#338). Solo usa la llave
 * **pública** (`pk_…`); la secreta vive en el API. La hoja de pago de Stripe captura los datos de
 * la tarjeta: nunca pasan por el código de la app.
 */
export class StripePaymentGateway implements PaymentGateway {
  private ready: Promise<void> | null = null;

  constructor(private readonly publishableKey: string) {}

  isAvailable(): boolean {
    // Una llave secreta aquí sería un error grave: se rechaza aunque esté configurada.
    return this.publishableKey.startsWith('pk_');
  }

  async pay({ clientSecret }: CardPaymentIntent): Promise<CardPaymentOutcome> {
    if (!this.isAvailable())
      return { status: 'failed', message: 'El cobro con tarjeta no está configurado.' };
    this.ready ??= initStripe({ publishableKey: this.publishableKey });
    await this.ready;

    const init = await initPaymentSheet({
      paymentIntentClientSecret: clientSecret,
      merchantDisplayName: MERCHANT_NAME,
    });
    if (init.error) return { status: 'failed', message: DECLINED };

    const { error } = await presentPaymentSheet();
    if (!error) return { status: 'paid' };
    if (error.code === 'Canceled') return { status: 'cancelled' };
    // El mensaje de Stripe ya viene en el idioma del teléfono y no trae datos de la tarjeta.
    return { status: 'failed', message: error.localizedMessage || DECLINED };
  }
}
