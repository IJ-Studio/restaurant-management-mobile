import type { Breadcrumb, ErrorEvent } from '@sentry/react-native';

const FILTERED = '[Filtrado]';

// Claves cuyo valor nunca debe salir del dispositivo (credenciales y datos personales).
const SENSITIVE_KEY =
  /pass(word|wd)?|contrasen|secret|token|authorization|cookie|api[-_]?key|session|jwt|credential|e-?mail|correo|phone|telefono|celular|rfc|curp|nombre|apellido|direccion|address|card|tarjeta|cvv/i;

// Valores sensibles que pueden venir dentro de un texto libre (mensajes de error, logs).
const JWT = /eyJ[\w-]+\.[\w-]+\.[\w-]+/g;
const BEARER = /Bearer\s+[\w.~+/-]+=*/gi;
const EMAIL = /[\w.+-]+@[\w-]+(\.[\w-]+)+/g;

export function scrubString(value: string): string {
  return value.replace(JWT, FILTERED).replace(BEARER, `Bearer ${FILTERED}`).replace(EMAIL, FILTERED);
}

/** Quita query string y fragmento: ahí suelen viajar tokens e identificadores. */
export function stripUrl(url: string): string {
  return url.split(/[?#]/)[0];
}

export function scrubData<T>(value: T, depth = 0): T {
  if (typeof value === 'string') return scrubString(value) as T;
  if (value === null || typeof value !== 'object') return value;
  if (depth > 6) return FILTERED as T;
  if (Array.isArray(value)) return value.map((item) => scrubData(item, depth + 1)) as T;

  const clean: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    clean[key] = SENSITIVE_KEY.test(key) ? FILTERED : scrubData(item, depth + 1);
  }
  return clean as T;
}

export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  if (breadcrumb.message) breadcrumb.message = scrubString(breadcrumb.message);
  if (breadcrumb.data) {
    breadcrumb.data = scrubData(breadcrumb.data);
    if (typeof breadcrumb.data.url === 'string') breadcrumb.data.url = stripUrl(breadcrumb.data.url);
  }
  return breadcrumb;
}

export function scrubEvent(event: ErrorEvent): ErrorEvent {
  // Del usuario solo se conserva el id interno, suficiente para agrupar errores.
  if (event.user) event.user = event.user.id === undefined ? {} : { id: event.user.id };

  if (event.request) {
    const { url, method } = event.request;
    event.request = { method, url: url ? stripUrl(url) : undefined };
  }

  if (event.message) event.message = scrubString(event.message);
  event.exception?.values?.forEach((exception) => {
    if (exception.value) exception.value = scrubString(exception.value);
  });

  if (event.extra) event.extra = scrubData(event.extra);
  if (event.breadcrumbs) event.breadcrumbs = event.breadcrumbs.map(scrubBreadcrumb);

  return event;
}
