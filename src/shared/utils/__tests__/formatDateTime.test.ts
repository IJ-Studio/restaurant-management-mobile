import { formatDate, formatDateTime, formatDay, formatMonthShort, formatTime } from '../formatDateTime';

// Mediodía local: el mismo día en cualquier zona horaria de América.
const DATE = new Date(2026, 9, 21, 12, 30);

describe('formatDateTime', () => {
  it('formatea en español de México', () => {
    expect(formatDay(DATE)).toBe('21');
    expect(formatMonthShort(DATE)).toBe('oct');
    expect(formatDate(DATE)).toMatch(/miércoles.*21.*octubre/);
    expect(formatTime(DATE)).toMatch(/12:30/);
    expect(formatDateTime(DATE.toISOString())).toMatch(/21.*oct/);
  });

  it('acepta el texto de Postgres aunque el motor no lo entienda, como Hermes', () => {
    const RealDate = Date;
    // Como Hermes: "2026-11-14 02:07:30.70-06" (con espacio) da Invalid Date.
    const hermes = jest
      .spyOn(global, 'Date')
      .mockImplementation(((value: string | number) =>
        typeof value === 'string' && value.includes(' ')
          ? new RealDate(Number.NaN)
          : new RealDate(value)) as never);
    try {
      expect(formatDate('2026-11-14 02:07:30.707928-06')).toMatch(/14.*noviembre/);
    } finally {
      hermes.mockRestore();
    }
  });
});
