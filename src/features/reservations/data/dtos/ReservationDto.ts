/** Fila de `reservaciones` del API. */
export interface ReservationDto {
  id: string;
  mesaId: number | null;
  clienteNombre: string;
  clienteTelefono: string | null;
  clienteEmail: string | null;
  fechaHora: string;
  numComensales: number;
  ocasion: string | null;
  peticionesEspeciales: string | null;
  estatus: string | null;
  canal: string | null;
  [extra: string]: unknown;
}

/** Body de POST /reservations (CreateReservationDto del API). */
export interface CreateReservationRequestDto {
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail: string;
  fechaHora: string;
  numComensales: number;
  ocasion?: string;
  peticionesEspeciales?: string;
  canal: string;
}

export interface CreateReservationResponseDto extends ReservationDto {
  requiereConfirmacion: boolean;
  mensaje: string;
}
