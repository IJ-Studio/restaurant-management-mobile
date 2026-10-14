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
}
