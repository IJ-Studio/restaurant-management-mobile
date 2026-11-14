import { toOperationRules } from '../../data/datasources/OperationRulesRemoteDataSource';
import {
  DEFAULT_RULES,
  partySizeProblem,
  restaurantMoment,
  RULE_MESSAGES,
  scheduleProblem,
  type OperationRules,
} from '../entities/OperationRules';

// Lunes cerrado; los demás días de 08:00 a 22:00, como devuelve GET /reglas.
const rules: OperationRules = toOperationRules({
  utcOffsetMin: -360,
  aceptaReservas: true,
  reservas: { anticipacionMin: 60, margenCierreMin: 30, comensalesMax: 50 },
  pedidos: { cantidadMaxPorPlatillo: 99 },
  horario: Array.from({ length: 7 }, (_, dia) => ({
    dia,
    apertura: '08:00:00',
    cierre: '22:00:00',
    cocinaCierre: '21:30:00',
    cerrado: dia === 1,
  })),
  diasEspeciales: [{ fecha: '2026-11-20', cerrado: true, apertura: null, cierre: null }],
});

// Viernes 13-nov-2026, 12:00 en México.
const NOW = new Date('2026-11-13T18:00:00Z');
const mx = (fechaHora: string) => new Date(`${fechaHora}-06:00`);

describe('reglas de operación (GET /reglas)', () => {
  it('calcula la hora del restaurante sin depender de la zona del teléfono', () => {
    expect(restaurantMoment(new Date('2026-11-14T02:00:00Z'), -360)).toEqual({
      date: '2026-11-13',
      day: 5,
      minutes: 20 * 60,
    });
  });

  it('acepta las 20:00 del mismo día', () => {
    expect(scheduleProblem(mx('2026-11-13T20:00:00'), rules, NOW)).toBeNull();
  });

  it.each([
    ['las 2 a. m.', '2026-11-14T02:00:00', RULE_MESSAGES.outsideHours('08:00:00', '22:00:00', 30)],
    [
      '15 minutos antes del cierre',
      '2026-11-13T21:45:00',
      RULE_MESSAGES.outsideHours('08:00:00', '22:00:00', 30),
    ],
    ['con menos de 1 hora de anticipación', '2026-11-13T12:30:00', RULE_MESSAGES.advance(60)],
    ['una hora que ya pasó', '2026-11-13T09:00:00', RULE_MESSAGES.past],
    ['un lunes (descanso)', '2026-11-16T14:00:00', RULE_MESSAGES.closedDay],
    ['un día especial cerrado', '2026-11-20T14:00:00', RULE_MESSAGES.closedDay],
  ])('rechaza %s con el mismo texto que el API', (_caso, fechaHora, mensaje) => {
    expect(scheduleProblem(mx(fechaHora), rules, NOW)).toBe(mensaje);
  });

  it('si el restaurante no toma reservaciones lo dice', () => {
    expect(scheduleProblem(mx('2026-11-14T14:00:00'), { ...rules, acceptsReservations: false }, NOW)).toBe(
      RULE_MESSAGES.notAccepting,
    );
  });

  it('sin horario (API sin respuesta) solo valida pasado y antelación; el servidor decide el resto', () => {
    expect(scheduleProblem(mx('2026-11-14T02:00:00'), DEFAULT_RULES, NOW)).toBeNull();
    expect(scheduleProblem(mx('2026-11-13T12:30:00'), DEFAULT_RULES, NOW)).toBe(RULE_MESSAGES.advance(60));
  });

  it('respeta el máximo de personas que configura el administrador', () => {
    expect(partySizeProblem(12, { ...rules, maxPartySize: 10 })).toBe(RULE_MESSAGES.partySize(10));
    expect(partySizeProblem(10, { ...rules, maxPartySize: 10 })).toBeNull();
  });

  it.each([
    [60, 'Las reservaciones se hacen con al menos 1 hora de anticipación.'],
    [120, 'Las reservaciones se hacen con al menos 2 horas de anticipación.'],
    [45, 'Las reservaciones se hacen con al menos 45 minutos de anticipación.'],
  ])('mismo texto de antelación que el API (%s min)', (min, texto) => {
    expect(RULE_MESSAGES.advance(min)).toBe(texto);
  });
});
