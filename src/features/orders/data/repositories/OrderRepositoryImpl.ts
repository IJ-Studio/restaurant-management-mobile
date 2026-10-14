import { AppError } from '../../../../core/errors/AppError';
import type { OrderLine, Table } from '../../domain/entities/TableOrder';
import type { OrderRepository, SentOrder } from '../../domain/repositories/OrderRepository';
import type { OrderRemoteDataSource } from '../datasources/OrderRemoteDataSource';

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
}
