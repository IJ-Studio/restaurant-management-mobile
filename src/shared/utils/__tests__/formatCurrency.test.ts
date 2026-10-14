import { formatCurrency } from '../formatCurrency';

describe('formatCurrency', () => {
  it.each([
    [145.5, '$145.50'],
    [0, '$0.00'],
    [1250, '$1,250.00'],
  ])('%p → %s', (amount, expected) => {
    expect(formatCurrency(amount)).toBe(expected);
  });
});
