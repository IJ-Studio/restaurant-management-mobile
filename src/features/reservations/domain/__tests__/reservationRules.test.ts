import { makeDraft, NOW } from '../../__fixtures__/reservations';
import { hasErrors, validateReservation } from '../entities/reservationRules';

const hoursFromNow = (h: number) => new Date(NOW.getTime() + h * 60 * 60 * 1000);

describe('validateReservation', () => {
  it('acepta una reservación válida', () => {
    expect(hasErrors(validateReservation(makeDraft(), NOW))).toBe(false);
  });

  it('rechaza una fecha pasada', () => {
    expect(validateReservation(makeDraft({ dateTime: hoursFromNow(-1) }), NOW).dateTime).toBe(
      'La fecha ya pasó.',
    );
  });

  it('exige al menos 1 hora de anticipación (regla del API)', () => {
    expect(validateReservation(makeDraft({ dateTime: hoursFromNow(0.5) }), NOW).dateTime).toMatch(/1 hora/);
    expect(validateReservation(makeDraft({ dateTime: hoursFromNow(1) }), NOW).dateTime).toBeUndefined();
  });

  it('rechaza una fecha inválida', () => {
    expect(validateReservation(makeDraft({ dateTime: new Date('x') }), NOW).dateTime).toBe(
      'Elige la fecha y la hora.',
    );
  });

  it.each([0, -2, 1.5, Number.NaN])('rechaza %p personas', (partySize) => {
    expect(validateReservation(makeDraft({ partySize }), NOW).partySize).toBe(
      'Debe haber al menos 1 persona.',
    );
  });

  it('acepta de 1 a 50 personas', () => {
    expect(validateReservation(makeDraft({ partySize: 1 }), NOW).partySize).toBeUndefined();
    expect(validateReservation(makeDraft({ partySize: 50 }), NOW).partySize).toBeUndefined();
    expect(validateReservation(makeDraft({ partySize: 51 }), NOW).partySize).toBe('Máximo 50 personas.');
  });

  it('valida nombre, teléfono y correo', () => {
    const errors = validateReservation(
      makeDraft({ customerName: ' L ', customerPhone: '123', customerEmail: 'laura' }),
      NOW,
    );
    expect(Object.keys(errors).sort()).toEqual(['customerEmail', 'customerName', 'customerPhone']);
  });

  it('limita las peticiones especiales a 500 caracteres', () => {
    expect(
      validateReservation(makeDraft({ specialRequests: 'a'.repeat(501) }), NOW).specialRequests,
    ).toBeDefined();
  });
});
