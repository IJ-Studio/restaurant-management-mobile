import { AppError } from '../../../../core/errors/AppError';
import type { NewReservation, Reservation } from '../../domain/entities/Reservation';
import type { CreateReservationRequestDto, ReservationDto } from '../dtos/ReservationDto';

export function toReservation(dto: ReservationDto): Reservation {
  const dateTime = new Date(dto.fechaHora);
  if (!dto?.id || Number.isNaN(dateTime.getTime())) {
    throw new AppError('server', 'Respuesta de reservación inválida.');
  }
  return {
    id: String(dto.id),
    customerName: dto.clienteNombre,
    customerPhone: dto.clienteTelefono ?? '',
    dateTime,
    partySize: dto.numComensales,
    status: dto.estatus ?? 'confirmada',
    tableId: dto.mesaId ?? null,
    notes: dto.peticionesEspeciales ?? '',
  };
}

/** La registra el personal desde piso: el canal es "telefono" (llamada o en persona). */
export function toCreateRequest(reservation: NewReservation): CreateReservationRequestDto {
  return {
    clienteNombre: reservation.customerName,
    clienteTelefono: reservation.customerPhone,
    clienteEmail: reservation.customerEmail,
    fechaHora: reservation.dateTime.toISOString(),
    numComensales: reservation.partySize,
    ...(reservation.notes ? { peticionesEspeciales: reservation.notes } : {}),
    canal: 'telefono',
  };
}
