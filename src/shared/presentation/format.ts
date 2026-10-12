const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

/** `125.5` → `$125.50` */
export function formatPrice(value: number): string {
  return currency.format(value);
}
