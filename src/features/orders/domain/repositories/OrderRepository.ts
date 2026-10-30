import type { ActiveOrder, OrderDetail } from '../entities/ActiveOrder';
import type { OrderLine, Table } from '../entities/TableOrder';

export interface SentOrder {
  orderId: string;
  message: string;
}

export interface OrderRepository {
  listTables(): Promise<Table[]>;
  /** Registra los platillos en la orden de la mesa a nombre del mesero y devuelve su id. */
  createTableOrder(waiterId: number, tableNumber: string, lines: OrderLine[]): Promise<string>;
  /** Manda la orden a cocina. */
  confirm(orderId: string): Promise<SentOrder>;
  /** Pedidos activos del día (sin cancelados, completados ni entregados). */
  listActive(): Promise<ActiveOrder[]>;
  /** Pedido de la mesa con sus platillos. */
  getDetail(tableNumber: string, orderId: string): Promise<OrderDetail>;
  /** Cancela un pedido que está en cocina; devuelve el mensaje del API. */
  cancel(orderId: string): Promise<string>;
  /** Quita un platillo de un pedido que sigue pendiente; devuelve el mensaje del API. */
  removeItem(itemId: number): Promise<string>;
}
