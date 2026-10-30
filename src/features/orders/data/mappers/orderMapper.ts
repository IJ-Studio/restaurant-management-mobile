import { toIsoTimestamp } from '../../../../shared/utils/apiDate';
import { tableNumberFromPlace, type ActiveOrder, type OrderDetail } from '../../domain/entities/ActiveOrder';
import type { ChargeReceipt, PaymentMethod } from '../../domain/entities/Payment';
import type {
  ChargeOrderResponseDto,
  OrderDetailDto,
  PaymentMethodDto,
  RecentOrderDto,
} from '../dtos/OrderDto';

/** `numeric` de Postgres llega como string; un valor ilegible cuenta como 0 en lugar de romper la lista. */
function toAmount(value: number | string | null | undefined): number {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

/** Solo imágenes por HTTPS (MASVS-NETWORK). */
function safeImageUrl(url: string | null): string | undefined {
  return url && /^https:\/\/\S+$/i.test(url) ? url : undefined;
}

export function toActiveOrder(dto: RecentOrderDto): ActiveOrder {
  const place = dto.table && dto.table !== 'N/A' ? dto.table : 'Sin mesa';
  const items = (dto.items ?? [])
    .filter((item) => item.nombre)
    .map((item) => ({ name: item.nombre ?? '', quantity: item.cantidad ?? 1 }));
  return {
    id: dto.id,
    customer: dto.customer?.trim() || 'Sin cliente',
    time: dto.time ?? '—',
    openedAt: dto.openedAt ? toIsoTimestamp(dto.openedAt) : undefined,
    firstItem: dto.item ?? items[0]?.name ?? '—',
    items,
    place,
    tableNumber: tableNumberFromPlace(place),
    status: dto.status ?? 'abierta',
    total: toAmount(dto.total),
  };
}

export function toOrderDetail(dto: OrderDetailDto): OrderDetail {
  return {
    id: dto.id,
    tableNumber: dto.mesa ?? undefined,
    status: dto.estatus ?? 'abierta',
    total: toAmount(dto.total),
    tip: toAmount(dto.propina),
    openedAt: dto.tiempoApertura ? toIsoTimestamp(dto.tiempoApertura) : undefined,
    kitchenNotes: dto.notasCocina?.trim() || undefined,
    items: dto.items.map((item) => ({
      id: item.id,
      name: item.platillo.nombre ?? 'Platillo',
      quantity: item.cantidad,
      unitPrice: toAmount(item.precioUnitario),
      notes: item.notas?.trim() || undefined,
      imageUrl: safeImageUrl(item.platillo.imagenUrl),
    })),
  };
}

const KIND: Record<string, PaymentMethod['kind']> = {
  efectivo: 'cash',
  tarjeta: 'card',
  digital: 'digital',
};

export function toPaymentMethod(dto: PaymentMethodDto): PaymentMethod {
  return {
    id: dto.id,
    name: dto.nombre,
    kind: dto.esEfectivo ? 'cash' : (KIND[(dto.tipo ?? '').toLowerCase()] ?? 'other'),
    allowsTip: dto.aplicaPropina !== false,
  };
}

export function toChargeReceipt(dto: ChargeOrderResponseDto): ChargeReceipt {
  return {
    message: dto.message || 'Pago registrado.',
    method: dto.metodo,
    total: toAmount(dto.total),
    tip: toAmount(dto.propina),
    charged: toAmount(dto.totalCobrado),
    change: toAmount(dto.cambio),
  };
}
