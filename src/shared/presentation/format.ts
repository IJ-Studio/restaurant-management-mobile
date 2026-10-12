const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

/** `125.5` → `$125.50` */
export function formatPrice(value: number): string {
  return currency.format(value);
}

const dateTime = new Intl.DateTimeFormat('es-MX', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** Fecha y hora local, corta: `lun, 13 oct, 19:30`. */
export function formatDateTime(value: Date): string {
  return dateTime.format(value);
}

/** `2026-10-13` en la zona del dispositivo (para prellenar formularios). */
export function toLocalDateInput(value: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}
