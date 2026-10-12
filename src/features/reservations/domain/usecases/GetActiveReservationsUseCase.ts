import { ACTIVE_STATUSES, type Reservation } from '../entities/Reservation';
import type { ReservationRepository } from '../repositories/ReservationRepository';

/** Vista operativa: reservaciones vigentes de hoy en adelante, de la más próxima a la más lejana. */
export class GetActiveReservationsUseCase {
  constructor(
    private readonly repository: ReservationRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(): Promise<Reservation[]> {
    const now = this.now();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const reservations = await this.repository.listFrom(startOfToday);
    return reservations
      .filter((r) => ACTIVE_STATUSES.includes(r.status) && r.dateTime >= startOfToday)
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
  }
}
