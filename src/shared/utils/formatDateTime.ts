const DATE_TIME = new Intl.DateTimeFormat('es-MX', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});
const DATE = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
const TIME = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' });

/** "lun, 20 oct, 08:00 p.m." en la zona horaria del dispositivo. */
export function formatDateTime(value: Date | string): string {
  return DATE_TIME.format(new Date(value));
}

export function formatDate(value: Date | string): string {
  return DATE.format(new Date(value));
}

export function formatTime(value: Date | string): string {
  return TIME.format(new Date(value));
}
