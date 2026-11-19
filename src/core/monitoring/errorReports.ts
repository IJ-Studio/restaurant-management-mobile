/**
 * Preferencia «Reportes de errores» de Privacidad (derecho de oposición). Vive fuera de `sentry.ts`
 * para que las features la cambien sin depender del SDK. Es de la persona, no del teléfono: al
 * cerrar sesión vuelve a su valor por defecto.
 */
let enabled = true;

export const errorReports = {
  isEnabled: (): boolean => enabled,
  setEnabled: (value: boolean): void => {
    enabled = value;
  },
};
