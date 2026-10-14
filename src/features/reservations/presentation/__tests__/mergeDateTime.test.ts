import { mergeDateTime } from '../components/DateTimeField';

describe('mergeDateTime', () => {
  const current = new Date(2026, 9, 20, 20, 30);

  it('cambia solo la fecha', () => {
    expect(mergeDateTime(current, new Date(2026, 10, 2, 9, 0), 'date')).toEqual(
      new Date(2026, 10, 2, 20, 30),
    );
  });

  it('cambia solo la hora', () => {
    expect(mergeDateTime(current, new Date(2030, 0, 1, 14, 15), 'time')).toEqual(
      new Date(2026, 9, 20, 14, 15),
    );
  });

  it('sin valor previo usa lo elegido', () => {
    expect(mergeDateTime(null, new Date(2026, 10, 2, 9, 0), 'date')).toEqual(new Date(2026, 10, 2, 9, 0));
  });
});
