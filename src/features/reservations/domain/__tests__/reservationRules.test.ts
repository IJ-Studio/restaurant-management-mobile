import { parseLocalDateTime, validateReservation, type ReservationDraft } from '../entities/reservationRules';

// Domingo 12 de octubre de 2026, 12:00 hora local.
const NOW = new Date(2026, 9, 12, 12, 0);

const valid: ReservationDraft = {
  customerName: '  María Pérez ',
  customerPhone: '55 1234 5678',
  customerEmail: 'Maria@Correo.MX',
  date: '2026-10-13',
  time: '19:30',
  partySize: '4',
  notes: ' Cumpleaños ',
};

describe('parseLocalDateTime', () => {
  it('arma la fecha en la hora local del dispositivo', () => {
    expect(parseLocalDateTime('2026-10-13', '19:30')).toEqual(new Date(2026, 9, 13, 19, 30));
  });

  it.each([
    ['2026-02-31', '10:00'],
    ['2026-13-01', '10:00'],
    ['13/10/2026', '10:00'],
    ['2026-10-13', '24:00'],
    ['2026-10-13', '7:5'],
  ])('rechaza %s %s', (date, time) => {
    expect(parseLocalDateTime(date, time)).toBeNull();
  });
});

describe('validateReservation', () => {
  it('acepta una reservación válida y limpia los datos', () => {
    const { errors, value } = validateReservation(valid, NOW);
    expect(errors).toEqual({});
    expect(value).toEqual({
      customerName: 'María Pérez',
      customerPhone: '55 1234 5678',
      customerEmail: 'maria@correo.mx',
      dateTime: new Date(2026, 9, 13, 19, 30),
      partySize: 4,
      notes: 'Cumpleaños',
    });
  });

  it('las notas son opcionales', () => {
    expect(validateReservation({ ...valid, notes: '   ' }, NOW).value?.notes).toBeUndefined();
  });

  it('rechaza una fecha pasada', () => {
    const { errors, value } = validateReservation({ ...valid, date: '2026-10-11' }, NOW);
    expect(value).toBeNull();
    expect(errors.date).toBe('La fecha ya pasó.');
  });

  it('rechaza una hora de hoy que ya pasó', () => {
    expect(validateReservation({ ...valid, date: '2026-10-12', time: '11:59' }, NOW).errors.date).toBe('La fecha ya pasó.');
  });

  it('pide al menos 1 hora de anticipación (regla del API)', () => {
    expect(validateReservation({ ...valid, date: '2026-10-12', time: '12:30' }, NOW).errors.time).toBe(
      'Reserva con al menos 1 hora de anticipación.',
    );
    expect(validateReservation({ ...valid, date: '2026-10-12', time: '13:00' }, NOW).value).not.toBeNull();
  });

  it.each(['0', '-2', '', 'dos', '2.5'])('rechaza %p personas', (partySize) => {
    expect(validateReservation({ ...valid, partySize }, NOW).errors.partySize).toBe('Debe haber al menos 1 persona.');
  });

  it('rechaza más de 50 personas', () => {
    expect(validateReservation({ ...valid, partySize: '51' }, NOW).errors.partySize).toBe('Máximo 50 personas.');
  });

  it('valida nombre, teléfono, correo, formato de fecha y hora y notas', () => {
    const { errors } = validateReservation(
      {
        customerName: 'A',
        customerPhone: 'abc',
        customerEmail: 'sin-arroba',
        date: 'mañana',
        time: '7pm',
        partySize: '2',
        notes: 'x'.repeat(501),
      },
      NOW,
    );
    expect(Object.keys(errors).sort()).toEqual(
      ['customerEmail', 'customerName', 'customerPhone', 'date', 'notes', 'time'].sort(),
    );
  });

  it('distingue una fecha que no existe', () => {
    expect(validateReservation({ ...valid, date: '2026-02-30' }, NOW).errors.date).toBe('Esa fecha no existe.');
  });
});
