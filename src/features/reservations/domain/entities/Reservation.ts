export type ReservationStatus = 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
export type ReservationChannel = 'telefono' | 'presencial';

export interface Reservation {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  /** Fecha y hora en ISO 8601. */
  dateTime: string;
  partySize: number;
  tableId?: number;
  occasion?: string;
  specialRequests?: string;
  status: ReservationStatus | string;
  channel?: string;
}

export interface NewReservation {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  dateTime: Date;
  partySize: number;
  occasion?: string;
  specialRequests?: string;
  channel: ReservationChannel;
}

export interface CreatedReservation {
  reservation: Reservation;
  /** El API deja la reservación como "pendiente" si hay que confirmarla con el cliente. */
  requiresConfirmation: boolean;
  message: string;
}

const INACTIVE: readonly string[] = ['cancelada', 'completada'];

export function isActive(reservation: Reservation): boolean {
  return !INACTIVE.includes(reservation.status);
}
