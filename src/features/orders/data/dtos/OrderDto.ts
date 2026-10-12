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
