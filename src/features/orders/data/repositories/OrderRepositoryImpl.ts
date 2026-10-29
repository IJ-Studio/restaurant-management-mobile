import { AppError } from '../../../../core/errors/AppError';
import type { ActiveOrder, OrderDetail } from '../../domain/entities/ActiveOrder';
import type { OrderLine, Table } from '../../domain/entities/TableOrder';
import type { OrderRepository, SentOrder } from '../../domain/repositories/OrderRepository';
import type { OrderRemoteDataSource } from '../datasources/OrderRemoteDataSource';
import { toActiveOrder, toOrderDetail } from '../mappers/orderMapper';

export class OrderRepositoryImpl implements OrderRepository {
  constructor(private readonly remote: OrderRemoteDataSource) {}

  async listTables(): Promise<Table[]> {
    const rows = await this.remote.listTables();
    return rows
      .filter((row) => row.activa !== false)
      .map((row) => ({
        id: row.id,
        number: row.numero,
        name: row.nombre ?? undefined,
        capacity: row.capacidad,
      }));
  }

  /** Solo se mandan id y cantidad: el precio lo toma el servidor de la base de datos. */
  async createTableOrder(waiterId: number, tableNumber: string, lines: OrderLine[]): Promise<string> {
    const response = await this.remote.createTableOrder({
      usuarioId: waiterId,
      mesa: tableNumber,
      items: lines.map((line) => ({ platilloId: line.dishId, cantidad: line.quantity })),
    });
    if (!response.ordenId) throw new AppError('server', 'El servidor no devolvió el número de orden.');
    return response.ordenId;
  }

  async confirm(orderId: string): Promise<SentOrder> {
    const response = await this.remote.confirm(orderId);
    return { orderId: response.ordenId ?? orderId, message: response.message || 'Pedido enviado a cocina.' };
  }

  async listActive(): Promise<ActiveOrder[]> {
    try {
      return (await this.remote.listRecent()).map(toActiveOrder);
    } catch (error) {
      throw forbiddenAs(error, 'Tu rol no tiene permiso para ver los pedidos.');
    }
  }

  /** El API devuelve todos los pedidos de la mesa; aquí se toma el que se pidió. */
  async getDetail(tableNumber: string, orderId: string): Promise<OrderDetail> {
    const orders = await this.remote.listByTable(tableNumber);
    const found = orders.find((order) => order.id === orderId);
    if (!found) throw new AppError('not-found', 'Este pedido ya no está disponible.');
    return toOrderDetail(found);
  }

  async cancel(orderId: string): Promise<string> {
    const response = await this.remote.cancel(orderId);
    return response.message || 'Pedido cancelado.';
  }

  async removeItem(itemId: number): Promise<string> {
    const response = await this.remote.removeItem(itemId);
    return response.message || 'Platillo quitado del pedido.';
  }
}

function forbiddenAs(error: unknown, message: string): unknown {
  if (error instanceof AppError && error.kind === 'forbidden') {
    return new AppError('forbidden', message, error.status);
  }
  return error;
}
