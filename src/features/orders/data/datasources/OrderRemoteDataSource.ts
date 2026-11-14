import type { HttpClient } from '../../../../core/http/httpClient';
import type {
  ChargeOrderRequestDto,
  ChargeOrderResponseDto,
  ConfirmOrderResponseDto,
  CreateTableOrderRequestDto,
  CreateTableOrderResponseDto,
  OrderActionResponseDto,
  OrderDetailDto,
  PaymentMethodDto,
  RecentOrderDto,
  TableAreaDto,
  TableDto,
} from '../dtos/OrderDto';

const id = (value: string) => encodeURIComponent(value);

export class OrderRemoteDataSource {
  constructor(private readonly http: HttpClient) {}

  listTables(): Promise<TableDto[]> {
    return this.http.get<TableDto[]>('mesas');
  }

  /** Endpoint público con el nombre del área de cada mesa. */
  listTableAreas(): Promise<TableAreaDto[]> {
    return this.http.get<TableAreaDto[]>('reservations/map');
  }

  createTableOrder(body: CreateTableOrderRequestDto): Promise<CreateTableOrderResponseDto> {
    return this.http.post<CreateTableOrderResponseDto>('pedidos/mesa', body);
  }

  confirm(orderId: string): Promise<ConfirmOrderResponseDto> {
    return this.http.post<ConfirmOrderResponseDto>(`pedidos/confirmar/${id(orderId)}`);
  }

  listRecent(): Promise<RecentOrderDto[]> {
    return this.http.get<RecentOrderDto[]>('pedidos/admin/recent');
  }

  getDetail(orderId: string): Promise<OrderDetailDto> {
    return this.http.get<OrderDetailDto>(`pedidos/${id(orderId)}`);
  }

  /** El API exige el motivo (Prioridad 3.3); lo ve el administrador. */
  cancel(orderId: string, motivo: string): Promise<OrderActionResponseDto> {
    return this.http.patch<OrderActionResponseDto>(`pedidos/cancelar/${id(orderId)}`, { motivo });
  }

  removeItem(itemId: number): Promise<OrderActionResponseDto> {
    return this.http.delete<OrderActionResponseDto>(`pedidos/item/${itemId}`);
  }

  updateStatus(orderId: string, estatus: string): Promise<OrderActionResponseDto> {
    return this.http.patch<OrderActionResponseDto>(`pedidos/${id(orderId)}/estatus`, { estatus });
  }

  listPaymentMethods(): Promise<PaymentMethodDto[]> {
    return this.http.get<PaymentMethodDto[]>('pedidos/metodos-pago');
  }

  charge(orderId: string, body: ChargeOrderRequestDto): Promise<ChargeOrderResponseDto> {
    return this.http.post<ChargeOrderResponseDto>(`pedidos/${id(orderId)}/cobrar`, body);
  }

  /** POST /pagos/crear-intento: el API calcula el monto y devuelve el `clientSecret` de Stripe. */
  createCardIntent(orderId: string): Promise<{ clientSecret: string; status: string }> {
    return this.http.post<{ clientSecret: string; status: string }>('pagos/crear-intento', {
      ordenId: orderId,
    });
  }
}
