import type { PrivacyPreference, PrivacySettings } from '../entities/PrivacySettings';

/** Privacidad de la cuenta propia (derechos ARCO). El API toma al usuario del token. */
export interface PrivacyRepository {
  get(): Promise<PrivacySettings>;
  /** Registra la aceptación explícita del aviso en esa versión. */
  acceptNotice(version: string): Promise<PrivacySettings>;
  /** Oposición: apaga o enciende un tratamiento opcional. */
  setPreference(preference: PrivacyPreference, enabled: boolean): Promise<PrivacySettings>;
  /** Cancelación: elimina la cuenta. Pide la contraseña para confirmar que es el titular. */
  deleteAccount(password: string): Promise<void>;
}
