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
});
