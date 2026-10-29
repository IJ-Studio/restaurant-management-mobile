// "2026-10-02 20:30:00+00" o "2026-10-15 20:41:35.626+00": el formato de `timestamptz` de Postgres.
const POSTGRES_PREFIX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/;
const ZONE_HOURS = /[+-]\d{2}$/;
const ZONE_COMPACT = /[+-]\d{4}$/;
const ZONE_ISO = /(Z|[+-]\d{2}:\d{2})$/;

/**
 * Convierte una fecha del API a ISO 8601 ("2026-10-02T20:30:00+00:00").
 * El API manda los `timestamptz` como los imprime Postgres; V8 (Jest) los entiende, pero Hermes
 * (la app en el celular) no siempre, y `new Date()` da "Invalid Date". Lo que no reconoce lo deja igual.
 */
export function toIsoTimestamp(value: string): string {
  const text = value.trim();
  if (!POSTGRES_PREFIX.test(text)) return value;

  const iso = text.replace(' ', 'T');
  if (ZONE_HOURS.test(iso)) return `${iso}:00`;
  if (ZONE_COMPACT.test(iso)) return `${iso.slice(0, -2)}:${iso.slice(-2)}`;
  return ZONE_ISO.test(iso) ? iso : `${iso}Z`;
}
