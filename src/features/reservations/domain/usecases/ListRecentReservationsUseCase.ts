import type { Reservation } from '../entities/Reservation';
import type { ReservationRepository } from '../repositories/ReservationRepository';

/** Días hacia atrás que cubre el historial. */
export const RECENT_RESERVATIONS_DAYS = 30;

/**
 * Reservaciones de los últimos días (antes de hoy), de la más reciente a la más antigua y con cualquier
 * estatus: el personal consulta quién vino, quién canceló y quién no se presentó.
 */
export class ListRecentReservationsUseCase {
  constructor(
    private readonly repository: ReservationRepository,
    private readonly now: () => Date = () => new Date(),
    private readonly days: number = RECENT_RESERVATIONS_DAYS,
  ) {}

  async execute(): Promise<Reservation[]> {
    const startOfDay = new Date(this.now());
    startOfDay.setHours(0, 0, 0, 0);
    const from = new Date(startOfDay);
    from.setDate(from.getDate() - this.days);

    const reservations = await this.repository.listFrom(from);
    return reservations
      .filter((reservation) => new Date(reservation.dateTime).getTime() < startOfDay.getTime())
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  }
}
