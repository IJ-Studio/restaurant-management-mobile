import { AppError } from '../../../../core/errors/AppError';
import type { ActiveOrder, OrderDetail } from '../../domain/entities/ActiveOrder';
import type { ChargeReceipt, ChargeRequest, PaymentMethod } from '../../domain/entities/Payment';
import type { OrderLine, Table } from '../../domain/entities/TableOrder';
import type { OrderRepository, OrderStep, SentOrder } from '../../domain/repositories/OrderRepository';
import type { OrderRemoteDataSource } from '../datasources/OrderRemoteDataSource';
import { toActiveOrder, toChargeReceipt, toOrderDetail, toPaymentMethod } from '../mappers/orderMapper';

/** Un 409 del API significa que otro dispositivo cambió el pedido antes; se pide refrescar. */
const CONFLICT_STATUS = 409;

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
      throw explain(error, 'Tu rol no tiene permiso para ver los pedidos.');
    }
  }

  async getDetail(orderId: string): Promise<OrderDetail> {
    try {
      return toOrderDetail(await this.remote.getDetail(orderId));
    } catch (error) {
      if (error instanceof AppError && error.kind === 'not-found') {
        throw new AppError('not-found', 'Este pedido ya no está disponible.', error.status);
      }
      throw explain(error, 'Tu rol no tiene permiso para ver este pedido.');
    }
  }

  async cancel(orderId: string): Promise<string> {
    const response = await this.remote.cancel(orderId);
    return response.message || 'Pedido cancelado.';
  }

  async removeItem(itemId: number): Promise<string> {
    const response = await this.remote.removeItem(itemId);
    return response.message || 'Platillo quitado del pedido.';
  }

  async updateStatus(orderId: string, step: OrderStep): Promise<string> {
    try {
      const response = await this.remote.updateStatus(orderId, step);
      return response.message || 'Pedido actualizado.';
    } catch (error) {
      throw explain(error, 'Tu rol no puede hacer este cambio en el pedido.');
    }
  }

  async listPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      return (await this.remote.listPaymentMethods()).map(toPaymentMethod);
    } catch (error) {
      throw explain(error, 'Solo caja puede cobrar pedidos.');
    }
  }

  /** El monto lo calcula el API con el total guardado; aquí solo viajan método, propina y efectivo. */
  async charge(orderId: string, request: ChargeRequest): Promise<ChargeReceipt> {
    try {
      const response = await this.remote.charge(orderId, {
        metodoPagoId: request.methodId,
        propina: request.tip > 0 ? request.tip : undefined,
        montoRecibido: request.received,
        referencia: request.reference?.trim() || undefined,
      });
      return toChargeReceipt(response);
    } catch (error) {
      throw explain(error, 'Solo caja puede cobrar pedidos.');
    }
  }
}

/** Traduce el 403 del RolesGuard y el 409 de concurrencia a mensajes que el personal entiende. */
function explain(error: unknown, forbiddenMessage: string): unknown {
  if (!(error instanceof AppError)) return error;
  if (error.kind === 'forbidden') return new AppError('forbidden', forbiddenMessage, error.status);
  if (error.status === CONFLICT_STATUS) {
    return new AppError('validation', `${error.message} Desliza hacia abajo para actualizar.`, error.status);
  }
  return error;
}
