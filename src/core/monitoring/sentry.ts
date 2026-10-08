import * as Sentry from '@sentry/react-native';

import { scrubBreadcrumb, scrubEvent } from './scrub';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

/** Inicia el reporte de errores y crashes. Sin DSN (p. ej. en CI) no hace nada. */
export function initSentry(): void {
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: __DEV__ ? 'development' : 'production',
    sendDefaultPii: false,
    beforeSend: scrubEvent,
    beforeBreadcrumb: scrubBreadcrumb,
  });
}

export { Sentry };
