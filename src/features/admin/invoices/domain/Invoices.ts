/** Solicitudes de factura en cola (Fase 2, paridad con Facturas de la web). */
export interface InvoiceRequest {
  id: number;
  orderId: string;
  customer: string;
  rfc: string | null;
  businessName: string | null;
  email: string | null;
  total: number | null;
  paid: boolean;
  requestedAt: string;
}

export interface IssuedInvoice {
  folio: string | null;
  emailSent: boolean;
  emailReason: string | null;
}

export interface InvoicesRepository {
  pending(): Promise<InvoiceRequest[]>;
  issue(id: number): Promise<IssuedInvoice>;
  reject(id: number, reason: string): Promise<void>;
}

/** Mismo mensaje y límites que el API (5 a 300 caracteres). */
export const REJECT_REASON_MESSAGE = 'Escribe el motivo del rechazo (al menos 5 caracteres).';
export const validRejectReason = (reason: string) => {
  const t = reason.trim();
  return t.length >= 5 && t.length <= 300;
};
