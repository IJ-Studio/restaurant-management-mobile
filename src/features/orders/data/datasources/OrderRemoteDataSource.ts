import type { HttpClient } from '../../../../core/http/httpClient';
import type {
  ConfirmOrderResponseDto,
  CreateTableOrderRequestDto,
  CreateTableOrderResponseDto,
  OrderActionResponseDto,
  RecentOrderDto,
  TableDto,
  TableOrderDto,
} from '../dtos/OrderDto';

export class OrderRemoteDataSource {
  constructor(private readonly http: HttpClient) {}

  listTables(): Promise<TableDto[]> {
    return this.http.get<TableDto[]>('mesas');
  }

  createTableOrder(body: CreateTableOrderRequestDto): Promise<CreateTableOrderResponseDto> {
    return this.http.post<CreateTableOrderResponseDto>('pedidos/mesa', body);
  }

  confirm(orderId: string): Promise<ConfirmOrderResponseDto> {
    return this.http.post<ConfirmOrderResponseDto>(`pedidos/confirmar/${encodeURIComponent(orderId)}`);
  }

  listRecent(): Promise<RecentOrderDto[]> {
    return this.http.get<RecentOrderDto[]>('pedidos/admin/recent');
  }

  listByTable(tableNumber: string): Promise<TableOrderDto[]> {
    return this.http.get<TableOrderDto[]>(`pedidos/usuario?mesaId=${encodeURIComponent(tableNumber)}`);
  }

  cancel(orderId: string): Promise<OrderActionResponseDto> {
    return this.http.patch<OrderActionResponseDto>(`pedidos/cancelar/${encodeURIComponent(orderId)}`);
  }

  removeItem(itemId: number): Promise<OrderActionResponseDto> {
    return this.http.delete<OrderActionResponseDto>(`pedidos/item/${itemId}`);
  }
}
