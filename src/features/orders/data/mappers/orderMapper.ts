import { toIsoTimestamp } from '../../../../shared/utils/apiDate';
import { tableNumberFromPlace, type ActiveOrder, type OrderDetail } from '../../domain/entities/ActiveOrder';
import type { RecentOrderDto, TableOrderDto } from '../dtos/OrderDto';

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
  return {
    id: dto.id,
    customer: dto.customer?.trim() || 'Sin cliente',
    time: dto.time ?? '—',
    firstItem: dto.item ?? '—',
    place,
    tableNumber: tableNumberFromPlace(place),
    status: dto.status ?? 'abierta',
    total: toAmount(dto.total),
  };
}

export function toOrderDetail(dto: TableOrderDto): OrderDetail {
  return {
    id: dto.id,
    tableNumber: dto.mesaId,
    status: dto.estatus ?? 'abierta',
    total: toAmount(dto.total),
    openedAt: dto.tiempoApertura ? toIsoTimestamp(dto.tiempoApertura) : undefined,
    items: dto.ordenItems.map((item) => ({
      id: item.id,
      name: item.platillo.nombre ?? 'Platillo',
      quantity: item.cantidad,
      unitPrice: toAmount(item.precioUnitario),
      imageUrl: safeImageUrl(item.platillo.imagenUrl),
    })),
  };
}
