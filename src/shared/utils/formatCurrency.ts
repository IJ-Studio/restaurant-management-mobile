const MXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

export function formatCurrency(amount: number): string {
  return MXN.format(amount);
}
