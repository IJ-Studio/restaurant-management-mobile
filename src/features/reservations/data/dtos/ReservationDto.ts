/** Fila de `reservaciones` (GET /reservations y respuesta de POST /reservations). */
export interface ReservationDto {
  id: string;
  clienteNombre: string;
  clienteTelefono?: string | null;
  fechaHora: string;
  numComensales: number;
  estatus?: string | null;
  mesaId?: number | null;
  peticionesEspeciales?: string | null;
  [key: string]: unknown;
}

/** Body de POST /reservations (CreateReservationDto del API). */
export interface CreateReservationRequestDto {
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail: string;
  fechaHora: string;
  numComensales: number;
  peticionesEspeciales?: string;
  canal: 'telefono';
}
