import { AppError } from '../../../core/errors/AppError';

export type IncidentType = 'retraso' | 'falta_insumo' | 'equipo' | 'devolucion' | 'otro';

export const INCIDENT_TYPES: { value: IncidentType; label: string; icon: string }[] = [
  { value: 'retraso', label: 'Retraso', icon: 'hourglass-outline' },
  { value: 'falta_insumo', label: 'Falta insumo', icon: 'basket-outline' },
  { value: 'equipo', label: 'Falla de equipo', icon: 'construct-outline' },
  { value: 'devolucion', label: 'Devolución', icon: 'return-down-back-outline' },
  { value: 'otro', label: 'Otro', icon: 'chatbubble-ellipses-outline' },
];

export function incidentLabel(type: string): string {
  return INCIDENT_TYPES.find((t) => t.value === type)?.label ?? 'Incidencia';
}

/** Minutos de retraso sugeridos (de un toque). */
export const DELAY_MINUTES = [5, 10, 15, 20, 30];

export interface Incident {
  id: string;
  orderId?: string;
  type: IncidentType | string;
  message?: string;
  minutes?: number;
  table?: string;
  reportedBy?: string;
  /** ISO 8601. */
  at?: string;
}

export interface NewIncident {
  type: IncidentType;
  orderId?: string;
  message?: string;
  minutes?: number;
}

export type WasteReason = 'caducado' | 'danado' | 'derrame' | 'preparacion' | 'devolucion' | 'otro';

export const WASTE_REASONS: { value: WasteReason; label: string }[] = [
  { value: 'caducado', label: 'Caducado' },
  { value: 'danado', label: 'Dañado' },
  { value: 'derrame', label: 'Derrame' },
  { value: 'preparacion', label: 'Error de preparación' },
  { value: 'devolucion', label: 'Devolución' },
  { value: 'otro', label: 'Otro' },
];

export function wasteReasonLabel(reason: string): string {
  return WASTE_REASONS.find((r) => r.value === reason)?.label ?? reason;
}

export interface InventoryProduct {
  id: number;
  name: string;
  category: string;
  unit: string;
  stock: number;
  costPerUnit: number;
}

export interface NewWaste {
  productId?: number;
  /** Cuando no está en el inventario. */
  productName?: string;
  quantity: number;
  unit?: string;
  reason: WasteReason;
  justification: string;
}

export interface WasteRecord {
  id: number;
  productName: string;
  quantity: number;
  unit: string;
  reason: string;
  justification: string;
  reportedBy?: string;
  cost: number;
  at?: string;
}

export interface KitchenRepository {
  listIncidents(orderId?: string): Promise<Incident[]>;
  reportIncident(incident: NewIncident): Promise<string>;
  listProducts(): Promise<InventoryProduct[]>;
  reportWaste(waste: NewWaste): Promise<string>;
  listWasteToday(): Promise<WasteRecord[]>;
}

/** Productos que coinciden con lo que se busca (sin acentos ni mayúsculas), los primeros `limit`. */
export function searchProducts(products: InventoryProduct[], query: string, limit = 8): InventoryProduct[] {
  const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const q = normalize(query);
  const found = q ? products.filter((p) => normalize(`${p.name} ${p.category}`).includes(q)) : products;
  return found.slice(0, limit);
}

export class ListIncidentsUseCase {
  constructor(private readonly repository: KitchenRepository) {}

  execute(orderId?: string): Promise<Incident[]> {
    return this.repository.listIncidents(orderId);
  }
}

/** Reporta una incidencia; un retraso necesita los minutos y "otro" necesita explicación. */
export class ReportIncidentUseCase {
  constructor(private readonly repository: KitchenRepository) {}

  async execute(incident: NewIncident): Promise<string> {
    const message = incident.message?.trim() || undefined;
    if (incident.type === 'retraso' && !incident.minutes) {
      throw new AppError('validation', 'Elige cuántos minutos más va a tardar.');
    }
    if (incident.type === 'otro' && !message) {
      throw new AppError('validation', 'Describe qué pasó.');
    }
    if (message && message.length > 300) throw new AppError('validation', 'El mensaje es demasiado largo.');
    return this.repository.reportIncident({
      ...incident,
      message,
      minutes: incident.type === 'retraso' ? incident.minutes : undefined,
    });
  }
}

export class ListInventoryProductsUseCase {
  constructor(private readonly repository: KitchenRepository) {}

  async execute(): Promise<InventoryProduct[]> {
    const products = await this.repository.listProducts();
    return [...products].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }
}

/** Registra una merma: producto (o nombre), cantidad mayor a cero y una justificación. */
export class ReportWasteUseCase {
  constructor(private readonly repository: KitchenRepository) {}

  async execute(waste: NewWaste): Promise<string> {
    const productName = waste.productName?.trim();
    if (!waste.productId && (!productName || productName.length < 2)) {
      throw new AppError('validation', 'Elige un producto del inventario o escribe qué se perdió.');
    }
    if (!Number.isFinite(waste.quantity) || waste.quantity <= 0) {
      throw new AppError('validation', 'Escribe una cantidad mayor a cero.');
    }
    const justification = waste.justification.trim();
    if (justification.length < 3) throw new AppError('validation', 'Explica brevemente qué pasó.');
    return this.repository.reportWaste({
      ...waste,
      productName: waste.productId ? undefined : productName,
      justification,
    });
  }
}

export class ListWasteTodayUseCase {
  constructor(private readonly repository: KitchenRepository) {}

  execute(): Promise<WasteRecord[]> {
    return this.repository.listWasteToday();
  }
}
