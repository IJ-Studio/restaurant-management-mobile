import { AppError } from '../../../../core/errors/AppError';
import type { ReservationStatus } from '../entities/Reservation';
import type { ReservationRepository } from '../repositories/ReservationRepository';

export const REASON_REQUIRED = 'Escribe el motivo de la cancelación.';

/** Cambiar el estado de una reservación (administrador). Mismas reglas que la web y el API. */
export class ChangeReservationStatusUseCase {
  constructor(private readonly repository: Pick<ReservationRepository, 'changeStatus'>) {}

  async execute(id: string, status: ReservationStatus, reason?: string): Promise<void> {
    const motive = reason?.trim() ?? '';
    if (status === 'cancelada' && motive.length < 3) throw new AppError('validation', REASON_REQUIRED);
    if (motive.length > 300) throw new AppError('validation', 'El motivo puede tener hasta 300 caracteres.');
    await this.repository.changeStatus(id, status, status === 'cancelada' ? motive : undefined);
  }
}
