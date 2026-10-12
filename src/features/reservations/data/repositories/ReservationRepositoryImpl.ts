import { AppError } from '../../../../core/errors/AppError';
import type { NewReservation, Reservation } from '../../domain/entities/Reservation';
import type { ReservationRepository } from '../../domain/repositories/ReservationRepository';
import type { ReservationRemoteDataSource } from '../datasources/ReservationRemoteDataSource';
import { toCreateRequest, toReservation } from '../mappers/reservationMapper';

export class ReservationRepositoryImpl implements ReservationRepository {
  constructor(private readonly remote: ReservationRemoteDataSource) {}

  async create(reservation: NewReservation): Promise<Reservation> {
    return toReservation(await this.remote.create(toCreateRequest(reservation)));
  }

  async listFrom(from: Date): Promise<Reservation[]> {
    try {
      const dtos = await this.remote.listFrom(from);
      if (!Array.isArray(dtos)) throw new AppError('server', 'Respuesta de reservaciones inválida.');
      return dtos.map(toReservation);
    } catch (error) {
      // Hoy GET /reservations solo admite Admin (ver docs/api-endpoints.md, "Qué falta en el API").
      if (error instanceof AppError && error.kind === 'forbidden') {
        throw new AppError('forbidden', 'Tu rol todavía no puede ver el listado de reservaciones.', 403);
      }
      throw error;
    }
  }
}
