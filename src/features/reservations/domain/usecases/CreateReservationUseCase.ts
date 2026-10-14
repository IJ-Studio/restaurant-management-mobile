import { AppError } from '../../../../core/errors/AppError';
import type { CreatedReservation, NewReservation } from '../entities/Reservation';
import { hasErrors, validateReservation } from '../entities/reservationRules';
import type { ReservationRepository } from '../repositories/ReservationRepository';

export class CreateReservationUseCase {
  constructor(
    private readonly repository: ReservationRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Una reservación inválida no se envía: se rechaza con el primer motivo. */
  async execute(draft: NewReservation): Promise<CreatedReservation> {
    const errors = validateReservation(draft, this.now());
    if (hasErrors(errors)) throw new AppError('validation', Object.values(errors)[0] as string);

    return this.repository.create({
      ...draft,
      customerName: draft.customerName.trim(),
      customerPhone: draft.customerPhone.trim(),
      customerEmail: draft.customerEmail.trim(),
      occasion: draft.occasion?.trim() || undefined,
      specialRequests: draft.specialRequests?.trim() || undefined,
    });
  }
}
