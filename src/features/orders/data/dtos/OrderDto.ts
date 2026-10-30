/** Body de POST /pedidos/mesa (CreateOrderMesaDto del API). */
export interface CreateTableOrderRequestDto {
  usuarioId: number;
  mesa: string;
  items: { platilloId: number; cantidad: number }[];
}

export interface CreateTableOrderResponseDto {
  success: boolean;
  message: string;
  ordenId: string;
  total: string | number;
}

export interface ConfirmOrderResponseDto {
  success: boolean;
  message: string;
  ordenId: string;
}

/** Fila de `mesas`. */
export interface TableDto {
  id: number;
  numero: string;
  nombre: string | null;
  capacidad: number;
  activa: boolean | null;
  [extra: string]: unknown;
}

/** Fila de GET /pedidos/admin/recent: pedidos activos del día ya resumidos por el API. */
export interface RecentOrderDto {
  id: string;
  customer: string | null;
  /** Hora formateada por el API en es-MX ("08:25 p.m."). */
  time: string | null;
  /** Primer platillo del pedido. */
  item: string | null;
  /** "Mesa B01", "Domicilio" o "N/A". */
  table: string | null;
  status: string | null;
  total: number | string | null;
  /** ISO 8601 (versiones del API anteriores no lo mandan). */
  openedAt?: string | null;
  items?: { nombre: string | null; cantidad: number | null }[];
}

/** GET /pedidos/:id — `numeric` y `timestamptz` llegan como string. */
export interface OrderDetailDto {
  id: string;
  tipo: string | null;
  mesa: string | null;
  estatus: string | null;
  subtotal: string | null;
  propina: string | null;
  total: string | null;
  notasCocina: string | null;
  tiempoApertura: string | null;
  items: {
    id: number;
    cantidad: number;
    precioUnitario: string;
    notas: string | null;
    platillo: { nombre: string | null; imagenUrl: string | null };
  }[];
}

/** Respuesta de PATCH /pedidos/cancelar/:id, DELETE /pedidos/item/:id y PATCH /pedidos/:id/estatus. */
export interface OrderActionResponseDto {
  success: boolean;
  message: string;
  [extra: string]: unknown;
}

/** Fila de GET /pedidos/metodos-pago. */
export interface PaymentMethodDto {
  id: number;
  nombre: string;
  tipo: string | null;
  aplicaPropina: boolean;
  esEfectivo: boolean;
}

/** Body de POST /pedidos/:id/cobrar. */
export interface ChargeOrderRequestDto {
  metodoPagoId: number;
  propina?: number;
  montoRecibido?: number;
  referencia?: string;
}

/** Respuesta de POST /pedidos/:id/cobrar; los montos llegan como string con 2 decimales. */
export interface ChargeOrderResponseDto {
  success: boolean;
  message: string;
  metodo: string;
  total: string;
  propina: string;
  totalCobrado: string;
  cambio: string;
}
