import { AppError } from '../../../core/errors/AppError';
import type { HttpClient } from '../../../core/http/httpClient';
import { toIsoTimestamp } from '../../../shared/utils/apiDate';
import type {
  Incident,
  InventoryProduct,
  KitchenRepository,
  NewIncident,
  NewWaste,
  WasteRecord,
} from '../domain/Kitchen';

/** GET /cocina/incidencias */
export interface IncidentDto {
  id: string;
  ordenId: string | null;
  tipo: string;
  mensaje: string | null;
  minutos: number | null;
  mesa: string | null;
  reportadoPor: string | null;
  creadoEn: string | null;
}

/** GET /inventario/productos — `numeric` llega como string. */
export interface ProductDto {
  id: number;
  name: string;
  category: string;
  unit: string;
  stock: string;
  costPerUnit: string;
}

/** Fila de GET /inventario/mermas */
export interface WasteDto {
  id: number;
  productName: string;
  quantity: string;
  unit: string;
  reason: string;
  justification: string;
  reportedBy: string | null;
  cost: string;
  createdAt: string | null;
}

const amount = (value: string | null | undefined) => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export function toIncident(dto: IncidentDto): Incident {
  return {
    id: dto.id,
    orderId: dto.ordenId ?? undefined,
    type: dto.tipo,
    message: dto.mensaje?.trim() || undefined,
    minutes: dto.minutos ?? undefined,
    table: dto.mesa ?? undefined,
    reportedBy: dto.reportadoPor ?? undefined,
    at: dto.creadoEn ? toIsoTimestamp(dto.creadoEn) : undefined,
  };
}

function explain(error: unknown, forbidden: string): unknown {
  if (error instanceof AppError && error.kind === 'forbidden') {
    return new AppError('forbidden', forbidden, error.status);
  }
  return error;
}

export class KitchenRepositoryImpl implements KitchenRepository {
  constructor(private readonly http: HttpClient) {}

  async listIncidents(orderId?: string): Promise<Incident[]> {
    const path = orderId ? `cocina/incidencias?ordenId=${encodeURIComponent(orderId)}` : 'cocina/incidencias';
    return (await this.http.get<IncidentDto[]>(path)).map(toIncident);
  }

  async reportIncident(incident: NewIncident): Promise<string> {
    const response = await this.http.post<{ message: string }>('cocina/incidencias', {
      tipo: incident.type,
      ordenId: incident.orderId,
      mensaje: incident.message,
      minutos: incident.minutes,
    });
    return response.message || 'Incidencia reportada.';
  }

  async listProducts(): Promise<InventoryProduct[]> {
    try {
      const rows = await this.http.get<ProductDto[]>('inventario/productos');
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        category: row.category,
        unit: row.unit,
        stock: amount(row.stock),
        costPerUnit: amount(row.costPerUnit),
      }));
    } catch (error) {
      throw explain(error, 'Solo cocina y administración pueden registrar mermas.');
    }
  }

  async reportWaste(waste: NewWaste): Promise<string> {
    try {
      const response = await this.http.post<{ message: string }>('inventario/mermas', {
        productId: waste.productId,
        productName: waste.productName,
        quantity: waste.quantity,
        unit: waste.unit,
        reason: waste.reason,
        justification: waste.justification,
      });
      return response.message || 'Merma registrada.';
    } catch (error) {
      throw explain(error, 'Solo cocina y administración pueden registrar mermas.');
    }
  }

  async listWasteToday(): Promise<WasteRecord[]> {
    const rows = await this.http.get<WasteDto[]>('inventario/mermas');
    return rows.map((row) => ({
      id: row.id,
      productName: row.productName,
      quantity: amount(row.quantity),
      unit: row.unit,
      reason: row.reason,
      justification: row.justification,
      reportedBy: row.reportedBy || undefined,
      cost: amount(row.cost),
      at: row.createdAt ? toIsoTimestamp(row.createdAt) : undefined,
    }));
  }
}
