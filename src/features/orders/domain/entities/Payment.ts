/** Método de cobro en caja (GET /pedidos/metodos-pago). */
export interface PaymentMethod {
  id: number;
  name: string;
  kind: 'cash' | 'card' | 'digital' | 'other';
  allowsTip: boolean;
}

export interface ChargeRequest {
  methodId: number;
  tip: number;
  /** Cuenta separada: cuánto del consumo se cobra en este pago (sin él, todo lo que falta). */
  amount?: number;
  /** Para quién es este pago ("Persona 2 de 4"). */
  label?: string;
  /** Solo efectivo: con cuánto pagó el cliente. */
  received?: number;
  /** Folio de la terminal o de la transferencia. */
  reference?: string;
}

export interface ChargeReceipt {
  message: string;
  method: string;
  total: number;
  tip: number;
  charged: number;
  change: number;
  /** Consumo cobrado hasta ahora y lo que falta; `closed` cuando ya se cubrió todo. */
  paid: number;
  remaining: number;
  closed: boolean;
}

/** Propinas sugeridas en la pantalla de cobro (% del total). */
export const TIP_PERCENTAGES = [0, 10, 15, 20] as const;

// Todo el cálculo de dinero va en centavos para no arrastrar errores de punto flotante.
const toCents = (amount: number) => Math.round(amount * 100);
const fromCents = (cents: number) => cents / 100;

export function tipFromPercent(total: number, percent: number): number {
  return fromCents(Math.round((toCents(total) * percent) / 100));
}

export interface ChargeSummary {
  /** Total del pedido más la propina. */
  toPay: number;
  /** Solo efectivo, cuando lo recibido alcanza. */
  change?: number;
  /** Solo efectivo, cuando lo recibido no alcanza. */
  missing?: number;
}

export function chargeSummary(
  total: number,
  tip: number,
  method: PaymentMethod | undefined,
  received?: number,
): ChargeSummary {
  const tipCents = method?.allowsTip === false ? 0 : toCents(tip);
  const toPayCents = toCents(total) + tipCents;
  const summary: ChargeSummary = { toPay: fromCents(toPayCents) };
  if (method?.kind === 'cash' && received !== undefined && Number.isFinite(received)) {
    const diff = toCents(received) - toPayCents;
    if (diff >= 0) summary.change = fromCents(diff);
    else summary.missing = fromCents(-diff);
  }
  return summary;
}

/**
 * Parte de una persona al dividir en partes iguales lo que falta entre quienes faltan por pagar.
 * La última persona paga exactamente lo que queda, así los centavos del redondeo no se pierden.
 */
export function equalShare(remaining: number, peopleLeft: number): number {
  if (peopleLeft <= 1) return remaining;
  return fromCents(Math.round(toCents(remaining) / peopleLeft));
}

/** Importe de los platillos elegidos (cuenta por platillo). */
export function itemsAmount(selection: { unitPrice: number; quantity: number }[]): number {
  return fromCents(selection.reduce((sum, item) => sum + toCents(item.unitPrice) * item.quantity, 0));
}

/** Valida el cobro antes de mandarlo; devuelve el motivo o null si está bien. */
export function validateCharge(
  total: number,
  request: ChargeRequest,
  method: PaymentMethod | undefined,
): string | null {
  if (!method) return 'Elige cómo paga el cliente.';
  if (!(total > 0)) return 'El pedido no tiene importe por cobrar.';
  if (!Number.isFinite(request.tip) || request.tip < 0) return 'La propina no es válida.';
  if (method.kind === 'cash') {
    if (request.received === undefined || !Number.isFinite(request.received)) {
      return 'Escribe con cuánto pagó el cliente.';
    }
    const { missing } = chargeSummary(total, request.tip, method, request.received);
    if (missing !== undefined) return `El efectivo no alcanza: faltan $${missing.toFixed(2)}.`;
  }
  if (request.reference && request.reference.trim().length > 100) return 'La referencia es demasiado larga.';
  return null;
}

/** Convierte lo que escribe el cajero ("1,250.50", "300") a número; NaN si no es un monto. */
export function parseAmount(text: string): number {
  const [whole, cents, extra] = text.replace(/[\s,$]/g, '').split('.');
  const valid = /^\d+$/.test(whole ?? '') && extra === undefined && /^\d{0,2}$/.test(cents ?? '');
  return valid ? Number(`${whole}.${cents || '0'}`) : Number.NaN;
}
