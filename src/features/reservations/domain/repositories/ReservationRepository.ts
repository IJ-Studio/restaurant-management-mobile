import type { NewReservation, Reservation } from '../entities/Reservation';

export interface ReservationRepository {
  create(reservation: NewReservation): Promise<Reservation>;
  /** Reservaciones desde `from` (inclusive). */
  listFrom(from: Date): Promise<Reservation[]>;
}
