import { env } from './env';

/**
 * Páginas legales de la web que la app enlaza desde Perfil. Son las mismas URL que se capturan en
 * Google Play Console (política de privacidad y recurso para eliminar la cuenta).
 */
export const legalLinks = {
  privacy: `${env.webUrl}/privacidad`,
  deleteAccount: `${env.webUrl}/eliminar-cuenta`,
} as const;
