import { toIsoTimestamp } from '../apiDate';

describe('toIsoTimestamp', () => {
  it.each([
    ['2026-10-02 20:30:00+00', '2026-10-02T20:30:00+00:00'],
    ['2026-10-15 20:41:35.626+00', '2026-10-15T20:41:35.626+00:00'],
    ['2026-10-15 14:41:35-06', '2026-10-15T14:41:35-06:00'],
    ['2026-10-15 14:41:35+0530', '2026-10-15T14:41:35+05:30'],
    ['2026-10-15 14:41', '2026-10-15T14:41Z'],
    ['2026-10-15T20:41:35Z', '2026-10-15T20:41:35Z'],
  ])('%s → %s', (input, expected) => {
    expect(toIsoTimestamp(input)).toBe(expected);
    expect(Number.isNaN(new Date(toIsoTimestamp(input)).getTime())).toBe(false);
  });

  it('el resultado apunta al mismo instante', () => {
    expect(new Date(toIsoTimestamp('2026-10-02 20:30:00+00')).toISOString()).toBe('2026-10-02T20:30:00.000Z');
  });

  it('deja igual lo que no reconoce', () => {
    expect(toIsoTimestamp('2026-10-02T20:30:00.000Z')).toBe('2026-10-02T20:30:00.000Z');
    expect(toIsoTimestamp('mañana')).toBe('mañana');
  });
});
