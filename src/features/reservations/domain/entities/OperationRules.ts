/**
 * Reglas de operación del restaurante, leídas de `GET /reglas` (Fase 3). Los mensajes son los mismos
 * que responde el API: la app avisa antes de enviar y el servidor vuelve a validar con el mismo texto.
 */
export interface DaySchedule {
  /** 0 = domingo … 6 = sábado. */
  day: number;
  opens: string | null;
  closes: string | null;
  kitchenCloses: string | null;
  closed: boolean;
}

export interface SpecialDay {
  date: string; // YYYY-MM-DD
  closed: boolean;
  opens: string | null;
  closes: string | null;
}

export interface OperationRules {
  utcOffsetMin: number;
  acceptsReservations: boolean;
  minAdvanceMin: number;
  closingMarginMin: number;
  maxPartySize: number;
  maxQuantityPerDish: number;
  schedule: DaySchedule[];
  specialDays: SpecialDay[];
}

/** Sin conexión con el API se usan los mismos valores por defecto que el servidor. */
export const DEFAULT_RULES: OperationRules = {
  utcOffsetMin: -360,
  acceptsReservations: true,
  minAdvanceMin: 60,
  closingMarginMin: 30,
  maxPartySize: 50,
  maxQuantityPerDish: 99,
  schedule: [],
  specialDays: [],
};

const hhmm = (time: string) => time.slice(0, 5);
const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

export const RULE_MESSAGES = {
  notAccepting: 'Por ahora el restaurante no está tomando reservaciones.',
  past: 'La fecha ya pasó.',
  advance: (min: number) =>
    `Las reservaciones se hacen con al menos ${
      min >= 60 && min % 60 === 0 ? `${min / 60} ${min === 60 ? 'hora' : 'horas'}` : `${min} minutos`
    } de anticipación.`,
  closedDay: 'El restaurante está cerrado ese día.',
  outsideHours: (opens: string, closes: string, margin: number) =>
    `Reservaciones de ${hhmm(opens)} a ${hhmm(closes)}, al menos ${margin} minutos antes del cierre.`,
  partySize: (max: number) => `El número de personas debe ser de 1 a ${max}.`,
};

/** Fecha, día y minutos en la hora del restaurante, sin depender de la zona del teléfono. */
export function restaurantMoment(date: Date, utcOffsetMin: number) {
  const local = new Date(date.getTime() + utcOffsetMin * 60_000);
  return {
    date: local.toISOString().slice(0, 10),
    day: local.getUTCDay(),
    minutes: local.getUTCHours() * 60 + local.getUTCMinutes(),
  };
}

/** Motivo por el que no se puede reservar a esa hora, o `null` si cumple las reglas. */
export function scheduleProblem(date: Date, rules: OperationRules, now: Date = new Date()): string | null {
  if (!rules.acceptsReservations) return RULE_MESSAGES.notAccepting;
  const time = date.getTime();
  if (time <= now.getTime()) return RULE_MESSAGES.past;
  if (time - now.getTime() < rules.minAdvanceMin * 60_000) return RULE_MESSAGES.advance(rules.minAdvanceMin);
  // Sin horario cargado (sin conexión) el servidor decide.
  if (rules.schedule.length === 0) return null;

  const moment = restaurantMoment(date, rules.utcOffsetMin);
  const special = rules.specialDays.find((d) => d.date === moment.date);
  const base = rules.schedule.find((d) => d.day === moment.day);
  if (special?.closed || !base || base.closed) return RULE_MESSAGES.closedDay;
  const opens = special?.opens ?? base.opens;
  const closes = special?.closes ?? base.closes;
  if (!opens || !closes) return RULE_MESSAGES.closedDay;
  if (moment.minutes < toMinutes(opens) || moment.minutes > toMinutes(closes) - rules.closingMarginMin) {
    return RULE_MESSAGES.outsideHours(opens, closes, rules.closingMarginMin);
  }
  return null;
}

export function partySizeProblem(size: number, rules: OperationRules): string | null {
  return Number.isInteger(size) && size >= 1 && size <= rules.maxPartySize
    ? null
    : RULE_MESSAGES.partySize(rules.maxPartySize);
}
