import type { CreatedReservation, NewReservation, Reservation } from '../entities/Reservation';

export interface ReservationRepository {
  create(reservation: NewReservation): Promise<CreatedReservation>;
  /** Reservaciones con fecha a partir de `from`. */
  listFrom(from: Date): Promise<Reservation[]>;
}
