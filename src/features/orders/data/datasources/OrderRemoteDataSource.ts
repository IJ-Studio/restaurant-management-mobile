import type { HttpClient } from '../../../../core/http/httpClient';
import type {
  ConfirmOrderResponseDto,
  CreateTableOrderRequestDto,
  CreateTableOrderResponseDto,
  TableDto,
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
}
