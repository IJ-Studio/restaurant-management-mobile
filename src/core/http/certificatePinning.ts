import {
  addSslPinningErrorListener,
  initializeSslPinning,
  isSslPinningAvailable,
  type PinningOptions,
} from 'react-native-ssl-public-key-pinning';

/**
 * Certificate pinning (MASVS-NETWORK): para el API de producción la app solo acepta certificados
 * emitidos bajo estas autoridades, aunque el teléfono confíe en otras (p. ej. un proxy instalado
 * en la red). Cada pin es el SHA-256 en base64 de la clave pública (SPKI) de una autoridad raíz.
 *
 * Se fijan las raíces y no el certificado del servidor porque ese rota cada pocas semanas. Las de
 * respaldo son las otras autoridades que usa el proveedor de hosting. Para recalcular un pin:
 *   openssl x509 -in raiz.pem -pubkey -noout | openssl pkey -pubin -outform DER \
 *     | openssl dgst -sha256 -binary | base64
 *
 * `expirationDate` apaga el pinning en esa fecha para que una versión vieja de la app no se quede
 * sin red si cambian las autoridades: hay que publicar una versión con pins vigentes antes.
 */
export const PINNED_HOSTS: PinningOptions = {
  'api-restaurant-management.onrender.com': {
    includeSubdomains: false,
    publicKeyHashes: [
      'mEflZT5enoR1FuXLgYYGqnVEoZvmf9c2bVBpiOjYQ0c=', // GTS Root R4 (cadena actual)
      'hxqRlPTu1bMS/0DITB1SSu0vd4u/8l8TjPgfaAp63Gc=', // GTS Root R1 (respaldo)
      'C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M=', // ISRG Root X1 (respaldo)
      'diGVwiVYbubAI3RW4hB9xU8e/CH2GnkuvVFZE8zmgzI=', // ISRG Root X2 (respaldo)
    ],
    expirationDate: '2027-11-30',
  },
};

export const UNTRUSTED_SERVER_MESSAGE =
  'La conexión no es segura: no se pudo verificar la identidad del servidor. Cambia de red y vuelve a intentarlo.';

type PinningReporter = (message: string, error?: unknown) => void;

let rejected = false;
let report: PinningReporter = () => undefined;

/** `App.tsx` conecta aquí el reporte de errores; así la capa HTTP no depende de Sentry. */
export function setPinningReporter(reporter: PinningReporter): void {
  report = reporter;
}

/**
 * Activa el pinning antes de la primera petición. En Expo Go y en Jest no existe el módulo nativo
 * y no hace nada. Nunca rechaza: si la activación falla, la app sigue funcionando y lo reporta.
 */
export async function initCertificatePinning(hosts: PinningOptions = PINNED_HOSTS): Promise<void> {
  if (!isSslPinningAvailable()) return;
  try {
    await initializeSslPinning(hosts);
    addSslPinningErrorListener(({ serverHostname }) => {
      rejected = true;
      report(`Certificado rechazado por pinning: ${serverHostname}`);
    });
  } catch (error) {
    report('No se pudo activar el certificate pinning', error);
  }
}

/** true una sola vez después de que el pinning rechace un certificado; el cliente HTTP lo usa para el aviso. */
export function consumePinningRejection(): boolean {
  const value = rejected;
  rejected = false;
  return value;
}
