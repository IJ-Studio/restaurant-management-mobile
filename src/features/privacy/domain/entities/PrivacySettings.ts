/**
 * Versión del aviso de privacidad que muestra la app. Al cambiar el texto del aviso se sube la
 * versión y la app vuelve a pedir la aceptación a todo el personal.
 */
export const PRIVACY_NOTICE_VERSION = '2026-11';

/** Preferencias de exclusión (derecho de oposición): activas mientras la persona no las apague. */
export type PrivacyPreference = 'pushNotifications' | 'errorReports';

export interface PrivacySettings {
  noticeAccepted: boolean;
  noticeVersion: string | null;
  /** Fecha ISO en que se aceptó; `null` si no se ha aceptado. */
  noticeAcceptedAt: string | null;
  pushNotifications: boolean;
  errorReports: boolean;
}

/** Hay que mostrar el aviso si nunca se aceptó o si se aceptó una versión anterior. */
export function needsConsent(settings: PrivacySettings): boolean {
  return !settings.noticeAccepted || settings.noticeVersion !== PRIVACY_NOTICE_VERSION;
}
