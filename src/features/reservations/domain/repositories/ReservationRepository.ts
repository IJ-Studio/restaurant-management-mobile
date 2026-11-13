import type {
  CreatedReservation,
  NewReservation,
  Reservation,
  ReservationStatus,
} from '../entities/Reservation';

export interface ReservationRepository {
  create(reservation: NewReservation): Promise<CreatedReservation>;
  /** Reservaciones con fecha a partir de `from`. */
  listFrom(from: Date): Promise<Reservation[]>;
  /** Cambia el estado; cancelar exige el motivo (lo guarda el API y lo ve el administrador). */
  changeStatus(id: string, status: ReservationStatus, reason?: string): Promise<void>;
}
