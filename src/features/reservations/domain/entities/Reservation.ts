export type ReservationStatus = 'pendiente' | 'confirmada' | 'cancelada' | 'completada' | 'no-show' | string;

/** Estados que siguen vigentes para el personal en piso. */
export const ACTIVE_STATUSES: readonly ReservationStatus[] = ['pendiente', 'confirmada'];

export interface Reservation {
  id: string;
  customerName: string;
  customerPhone: string;
  dateTime: Date;
  partySize: number;
  status: ReservationStatus;
  tableId: number | null;
  notes: string;
}

/** Datos ya validados para crear una reservación. */
export interface NewReservation {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  dateTime: Date;
  partySize: number;
  notes?: string;
}
