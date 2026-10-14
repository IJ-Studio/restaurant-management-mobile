import type { NewReservation } from './Reservation';

export type ReservationErrors = Partial<Record<keyof NewReservation, string>>;

// Mismas reglas que CreateReservationDto y ReservationsService del API.
export const MIN_ADVANCE_MS = 60 * 60 * 1000;
export const MAX_PARTY_SIZE = 50;
const PHONE = /^[0-9+\-\s()]{8,20}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateReservation(draft: NewReservation, now: Date = new Date()): ReservationErrors {
  const errors: ReservationErrors = {};
  const name = draft.customerName.trim();

  if (name.length < 2 || name.length > 150)
    errors.customerName = 'Escribe el nombre del cliente (2 a 150 caracteres).';
  if (!PHONE.test(draft.customerPhone.trim()))
    errors.customerPhone = 'Escribe un teléfono válido (8 a 20 dígitos).';
  if (!EMAIL.test(draft.customerEmail.trim())) errors.customerEmail = 'Escribe un correo válido.';

  const time = draft.dateTime.getTime();
  if (Number.isNaN(time)) errors.dateTime = 'Elige la fecha y la hora.';
  else if (time < now.getTime()) errors.dateTime = 'La fecha ya pasó.';
  else if (time - now.getTime() < MIN_ADVANCE_MS)
    errors.dateTime = 'Reserva con al menos 1 hora de anticipación.';

  if (!Number.isInteger(draft.partySize) || draft.partySize < 1) {
    errors.partySize = 'Debe haber al menos 1 persona.';
  } else if (draft.partySize > MAX_PARTY_SIZE) {
    errors.partySize = `Máximo ${MAX_PARTY_SIZE} personas.`;
  }

  if ((draft.specialRequests ?? '').length > 500) errors.specialRequests = 'Máximo 500 caracteres.';

  return errors;
}

export function hasErrors(errors: ReservationErrors): boolean {
  return Object.keys(errors).length > 0;
}
