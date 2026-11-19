import type { HttpClient } from '../../../../core/http/httpClient';
import type { InvoiceRequest, InvoicesRepository, IssuedInvoice } from '../domain/Invoices';

interface RequestDto {
  id: number;
  ordenId: string;
  cliente: string;
  rfc: string | null;
  razonSocial: string | null;
  email: string | null;
  totalOrden: string | number | null;
  estatusOrden: string | null;
  creadoEn: string;
}

/** GET /solicitudes-factura, POST /solicitudes-factura/:id/emitir y /:id/rechazar (solo admin). */
export class InvoicesRepositoryImpl implements InvoicesRepository {
  constructor(private readonly http: HttpClient) {}

  async pending(): Promise<InvoiceRequest[]> {
    const rows = await this.http.get<RequestDto[]>('solicitudes-factura?estatus=pendiente');
    return rows.map((r) => ({
      id: r.id,
      orderId: r.ordenId,
      customer: r.cliente,
      rfc: r.rfc,
      businessName: r.razonSocial,
      email: r.email,
      total: r.totalOrden === null ? null : Number(r.totalOrden),
      paid: r.estatusOrden === 'pagada',
      requestedAt: r.creadoEn,
    }));
  }

  async issue(id: number): Promise<IssuedInvoice> {
    const r = await this.http.post<{ folio: string | null; correo: { enviado: boolean; motivo?: string } }>(
      `solicitudes-factura/${id}/emitir`,
    );
    return { folio: r.folio, emailSent: r.correo.enviado, emailReason: r.correo.motivo ?? null };
  }

  async reject(id: number, reason: string): Promise<void> {
    await this.http.post(`solicitudes-factura/${id}/rechazar`, { motivo: reason.trim() });
  }
}
