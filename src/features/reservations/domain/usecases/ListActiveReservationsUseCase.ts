import { isActive, type Reservation } from '../entities/Reservation';
import type { ReservationRepository } from '../repositories/ReservationRepository';

/** Reservaciones activas del restaurante desde el inicio del día, de la más próxima a la más lejana. */
export class ListActiveReservationsUseCase {
  constructor(
    private readonly repository: ReservationRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(): Promise<Reservation[]> {
    const startOfDay = new Date(this.now());
    startOfDay.setHours(0, 0, 0, 0);

    const reservations = await this.repository.listFrom(startOfDay);
    return reservations
      .filter(isActive)
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  }
}
