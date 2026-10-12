import type { NewReservation, Reservation } from '../domain/entities/Reservation';
import type { ReservationRepository } from '../domain/repositories/ReservationRepository';

export const NOW = new Date('2026-10-20T12:00:00-06:00');

export function makeDraft(overrides: Partial<NewReservation> = {}): NewReservation {
  return {
    customerName: 'Laura Méndez',
    customerPhone: '55 1234 5678',
    customerEmail: 'laura@correo.mx',
    dateTime: new Date('2026-10-20T20:00:00-06:00'),
    partySize: 4,
    channel: 'telefono',
    ...overrides,
  };
}

export function makeReservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: 'a1b2',
    customerName: 'Laura Méndez',
    customerPhone: '55 1234 5678',
    customerEmail: 'laura@correo.mx',
    dateTime: '2026-10-21T02:00:00.000Z',
    partySize: 4,
    tableId: 7,
    status: 'confirmada',
    channel: 'telefono',
    ...overrides,
  };
}

export function makeReservationRepository(
  list: Reservation[] = [makeReservation()],
): jest.Mocked<ReservationRepository> {
  return {
    create: jest.fn().mockImplementation(async () => ({
      reservation: makeReservation(),
      requiresConfirmation: false,
      message: 'Reserva confirmada.',
    })),
    listFrom: jest.fn().mockResolvedValue(list),
  };
}
