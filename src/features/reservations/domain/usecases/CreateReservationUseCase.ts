import { AppError } from '../../../../core/errors/AppError';
import type { Reservation } from '../entities/Reservation';
import { validateReservation, type ReservationDraft } from '../entities/reservationRules';
import type { ReservationRepository } from '../repositories/ReservationRepository';

export class CreateReservationUseCase {
  constructor(
    private readonly repository: ReservationRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Valida otra vez antes de enviar: una reservación inválida nunca llega al API. */
  execute(draft: ReservationDraft): Promise<Reservation> {
    const { errors, value } = validateReservation(draft, this.now());
    if (!value) {
      return Promise.reject(new AppError('validation', Object.values(errors)[0] ?? 'Datos inválidos.'));
    }
    return this.repository.create(value);
  }
}
