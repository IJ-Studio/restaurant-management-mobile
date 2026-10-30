import type { ActiveOrder, OrderDetail } from '../entities/ActiveOrder';
import type { ChargeReceipt, ChargeRequest, PaymentMethod } from '../entities/Payment';
import type { OrderLine, Table } from '../entities/TableOrder';

export interface SentOrder {
  orderId: string;
  message: string;
}

/** Pasos del flujo que el personal hace desde la app (cocina y piso). */
export type OrderStep = 'en_preparacion' | 'lista' | 'entregada';

export interface OrderRepository {
  listTables(): Promise<Table[]>;
  /** Registra los platillos en la orden de la mesa a nombre del mesero y devuelve su id. */
  createTableOrder(
    waiterId: number,
    tableNumber: string,
    lines: OrderLine[],
    details?: { guests?: number; kitchenNote?: string },
  ): Promise<string>;
  /** Manda la orden a cocina. */
  confirm(orderId: string): Promise<SentOrder>;
  /** Pedidos activos del día (sin cancelados, completados ni pagados). */
  listActive(): Promise<ActiveOrder[]>;
  getDetail(orderId: string): Promise<OrderDetail>;
  /** Cancela un pedido que está en cocina; devuelve el mensaje del API. */
  cancel(orderId: string): Promise<string>;
  /** Quita un platillo de un pedido que sigue pendiente; devuelve el mensaje del API. */
  removeItem(itemId: number): Promise<string>;
  /** Avanza el pedido en cocina o lo marca entregado; devuelve el mensaje del API. */
  updateStatus(orderId: string, step: OrderStep): Promise<string>;
  listPaymentMethods(): Promise<PaymentMethod[]>;
  charge(orderId: string, request: ChargeRequest): Promise<ChargeReceipt>;
}
