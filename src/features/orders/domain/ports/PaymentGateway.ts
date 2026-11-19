/** Intención de pago creada por el API: el monto lo calcula el servidor, nunca la app. */
export interface CardPaymentIntent {
  clientSecret: string;
}

export type CardPaymentOutcome =
  { status: 'paid' } | { status: 'cancelled' } | { status: 'failed'; message: string };

/**
 * Puerto del cobro con tarjeta (patrón Adapter): el dominio no sabe que detrás está Stripe.
 * Solo recibe el `clientSecret`: la llave secreta vive en el API y nunca llega a la app.
 */
export interface PaymentGateway {
  /** `false` en Expo Go o sin llave pública configurada: la opción no se ofrece. */
  isAvailable(): boolean;
  pay(intent: CardPaymentIntent): Promise<CardPaymentOutcome>;
}
