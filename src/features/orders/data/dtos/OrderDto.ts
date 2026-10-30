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
}

/** Pedido de GET /pedidos/usuario?mesaId=…; `numeric` y `timestamptz` llegan como string. */
export interface TableOrderDto {
  id: string;
  mesaId: string;
  estatus: string | null;
  total: string | null;
  tiempoApertura: string | null;
  ordenItems: {
    id: number;
    cantidad: number;
    precioUnitario: string;
    platillo: { nombre: string | null; imagenUrl: string | null };
  }[];
}

/** Respuesta de PATCH /pedidos/cancelar/:id y DELETE /pedidos/item/:id. */
export interface OrderActionResponseDto {
  success: boolean;
  message: string;
  [extra: string]: unknown;
}
