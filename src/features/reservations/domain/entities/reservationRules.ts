import type { NewReservation } from './Reservation';

/** Lo que escribe el personal en el formulario, tal cual. */
export interface ReservationDraft {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  /** `AAAA-MM-DD` */
  date: string;
  /** `HH:MM` (24 h) */
  time: string;
  partySize: string;
  notes: string;
}

export type ReservationField = keyof ReservationDraft;
export type ReservationErrors = Partial<Record<ReservationField, string>>;

// Mismas reglas que CreateReservationDto y ReservationsService del API, para avisar antes de enviar.
export const MIN_ADVANCE_MS = 60 * 60 * 1000;
export const MAX_PARTY_SIZE = 50;
export const MAX_NOTES_LENGTH = 500;
const PHONE = /^[0-9+\-\s()]{8,20}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Fecha y hora locales del dispositivo; `null` si no es una fecha real (p. ej. 31 de febrero). */
export function parseLocalDateTime(date: string, time: string): Date | null {
  const d = DATE.exec(date.trim());
  const t = TIME.exec(time.trim());
  if (!d || !t) return null;
  const [year, month, day] = [Number(d[1]), Number(d[2]), Number(d[3])];
  const result = new Date(year, month - 1, day, Number(t[1]), Number(t[2]));
  if (result.getFullYear() !== year || result.getMonth() !== month - 1 || result.getDate() !== day) return null;
  return result;
}

export function validateReservation(
  draft: ReservationDraft,
  now: Date,
): { errors: ReservationErrors; value: NewReservation | null } {
  const errors: ReservationErrors = {};
  const name = draft.customerName.trim();
  const phone = draft.customerPhone.trim();
  const email = draft.customerEmail.trim().toLowerCase();
  const notes = draft.notes.trim();

  if (name.length < 2 || name.length > 150) errors.customerName = 'Escribe el nombre del comensal (2 a 150 letras).';
  if (!PHONE.test(phone)) errors.customerPhone = 'Teléfono inválido: 8 a 20 dígitos.';
  if (!EMAIL.test(email)) errors.customerEmail = 'Escribe un correo válido.';

  const dateTime = parseLocalDateTime(draft.date, draft.time);
  if (!TIME.test(draft.time.trim())) errors.time = 'Hora inválida. Usa HH:MM (24 h).';
  if (!DATE.test(draft.date.trim())) {
    errors.date = 'Fecha inválida. Usa AAAA-MM-DD.';
  } else if (!errors.time && !dateTime) {
    errors.date = 'Esa fecha no existe.';
  } else if (dateTime && dateTime.getTime() <= now.getTime()) {
    errors.date = 'La fecha ya pasó.';
  } else if (dateTime && dateTime.getTime() - now.getTime() < MIN_ADVANCE_MS) {
    errors.time = 'Reserva con al menos 1 hora de anticipación.';
  }

  const partySize = Number(draft.partySize.trim());
  if (!/^\d+$/.test(draft.partySize.trim()) || partySize < 1) {
    errors.partySize = 'Debe haber al menos 1 persona.';
  } else if (partySize > MAX_PARTY_SIZE) {
    errors.partySize = `Máximo ${MAX_PARTY_SIZE} personas.`;
  }

  if (notes.length > MAX_NOTES_LENGTH) errors.notes = `Máximo ${MAX_NOTES_LENGTH} caracteres.`;

  if (Object.keys(errors).length > 0 || !dateTime) return { errors, value: null };
  return {
    errors,
    value: {
      customerName: name,
      customerPhone: phone,
      customerEmail: email,
      dateTime,
      partySize,
      notes: notes || undefined,
    },
  };
}
