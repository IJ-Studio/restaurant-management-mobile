import { AppError } from '../../../../core/errors/AppError';
import type { CreatedReservation, NewReservation, Reservation } from '../../domain/entities/Reservation';
import type { ReservationRepository } from '../../domain/repositories/ReservationRepository';
import type { ReservationRemoteDataSource } from '../datasources/ReservationRemoteDataSource';
import { toCreatedReservation, toCreateRequest, toReservation } from '../mappers/reservationMapper';

export class ReservationRepositoryImpl implements ReservationRepository {
  constructor(private readonly remote: ReservationRemoteDataSource) {}

  /** Los 400 del API ("No hay mesas disponibles", "El restaurante está cerrado…") se muestran tal cual. */
  async create(reservation: NewReservation): Promise<CreatedReservation> {
    return toCreatedReservation(await this.remote.create(toCreateRequest(reservation)));
  }

  async listFrom(from: Date): Promise<Reservation[]> {
    try {
      return (await this.remote.listFrom(from)).map(toReservation);
    } catch (error) {
      if (error instanceof AppError && error.kind === 'forbidden') {
        throw new AppError('forbidden', 'Tu rol no tiene permiso para ver las reservaciones.', error.status);
      }
      throw error;
    }
  }
}
