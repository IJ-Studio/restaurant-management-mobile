import { AppError } from '../../../../core/errors/AppError';
import type {
  FreeTable,
  CreatedReservation,
  NewReservation,
  Reservation,
  ReservationStatus,
} from '../../domain/entities/Reservation';
import type { ReservationRepository } from '../../domain/repositories/ReservationRepository';
import type { ReservationRemoteDataSource } from '../datasources/ReservationRemoteDataSource';
import { toCreatedReservation, toCreateRequest, toReservation } from '../mappers/reservationMapper';

export class ReservationRepositoryImpl implements ReservationRepository {
  constructor(private readonly remote: ReservationRemoteDataSource) {}

  /** Los 400 del API ("No hay mesas disponibles", "El restaurante está cerrado…") se muestran tal cual. */
  async create(reservation: NewReservation): Promise<CreatedReservation> {
    return toCreatedReservation(await this.remote.create(toCreateRequest(reservation)));
  }

  async changeStatus(id: string, status: ReservationStatus, reason?: string): Promise<void> {
    try {
      await this.remote.updateStatus(
        id,
        reason ? { estatus: status, motivoCancelacion: reason } : { estatus: status },
      );
    } catch (error) {
      if (error instanceof AppError && error.kind === 'forbidden') {
        throw new AppError(
          'forbidden',
          'Solo el administrador puede cambiar el estado de una reservación.',
          error.status,
        );
      }
      throw error;
    }
  }

  async freeTables(dateTime: Date, partySize: number, utcOffsetMin: number): Promise<FreeTable[]> {
    const local = new Date(dateTime.getTime() + utcOffsetMin * 60_000).toISOString();
    const { mesasDisponibles } = await this.remote.availability(
      local.slice(0, 10),
      local.slice(11, 16),
      partySize,
    );
    return mesasDisponibles.map((m) => ({ id: m.id, number: m.numero, capacity: m.capacidad }));
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
