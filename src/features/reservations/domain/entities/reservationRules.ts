import { DEFAULT_RULES, partySizeProblem, scheduleProblem, type OperationRules } from './OperationRules';
import type { NewReservation } from './Reservation';

export type ReservationErrors = Partial<Record<keyof NewReservation, string>>;

// Formato de los datos del cliente: mismas reglas que CreateReservationDto del API.
// Horario, antelación y personas vienen de GET /reglas (OperationRules).
const PHONE = /^[0-9+\-\s()]{8,20}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateReservation(
  draft: NewReservation,
  now: Date = new Date(),
  rules: OperationRules = DEFAULT_RULES,
): ReservationErrors {
  const errors: ReservationErrors = {};
  const name = draft.customerName.trim();

  if (name.length < 2 || name.length > 150)
    errors.customerName = 'Escribe el nombre del cliente (2 a 150 caracteres).';
  if (!PHONE.test(draft.customerPhone.trim()))
    errors.customerPhone = 'Escribe un teléfono válido (8 a 20 dígitos).';
  if (!EMAIL.test(draft.customerEmail.trim())) errors.customerEmail = 'Escribe un correo válido.';

  if (Number.isNaN(draft.dateTime.getTime())) errors.dateTime = 'Elige la fecha y la hora.';
  else {
    const problem = scheduleProblem(draft.dateTime, rules, now);
    if (problem) errors.dateTime = problem;
  }

  const party = partySizeProblem(draft.partySize, rules);
  if (party) errors.partySize = party;

  if ((draft.specialRequests ?? '').length > 500) errors.specialRequests = 'Máximo 500 caracteres.';

  return errors;
}

export function hasErrors(errors: ReservationErrors): boolean {
  return Object.keys(errors).length > 0;
}
