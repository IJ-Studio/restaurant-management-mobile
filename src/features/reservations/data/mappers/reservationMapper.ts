import { toIsoTimestamp } from '../../../../shared/utils/apiDate';
import type { CreatedReservation, NewReservation, Reservation } from '../../domain/entities/Reservation';
import type {
  CreateReservationRequestDto,
  CreateReservationResponseDto,
  ReservationDto,
} from '../dtos/ReservationDto';

export function toReservation(dto: ReservationDto): Reservation {
  return {
    id: dto.id,
    customerName: dto.clienteNombre,
    customerPhone: dto.clienteTelefono ?? undefined,
    customerEmail: dto.clienteEmail ?? undefined,
    dateTime: toIsoTimestamp(dto.fechaHora),
    partySize: dto.numComensales,
    tableId: dto.mesaId ?? undefined,
    occasion: dto.ocasion ?? undefined,
    specialRequests: dto.peticionesEspeciales ?? undefined,
    status: dto.estatus ?? 'confirmada',
    channel: dto.canal ?? undefined,
  };
}

export function toCreateRequest(reservation: NewReservation): CreateReservationRequestDto {
  return {
    clienteNombre: reservation.customerName,
    clienteTelefono: reservation.customerPhone,
    clienteEmail: reservation.customerEmail,
    fechaHora: reservation.dateTime.toISOString(),
    numComensales: reservation.partySize,
    ocasion: reservation.occasion,
    peticionesEspeciales: reservation.specialRequests,
    canal: reservation.channel,
  };
}

export function toCreatedReservation(dto: CreateReservationResponseDto): CreatedReservation {
  return {
    reservation: toReservation(dto),
    requiresConfirmation: dto.requiereConfirmacion === true,
    message: dto.mensaje || 'Reservación registrada.',
  };
}
