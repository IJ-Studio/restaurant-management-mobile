/** Variables públicas de la app. Solo EXPO_PUBLIC_*: todo lo que esté aquí termina en el bundle. */
const DEFAULT_WEB_URL = 'https://el-quijote.vercel.app';

export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? '',
  /** Web pública del restaurante: de aquí salen las páginas legales que pide Google Play. */
  webUrl: (process.env.EXPO_PUBLIC_WEB_URL || DEFAULT_WEB_URL).replace(/\/+$/, ''),
  httpTimeoutMs: 15000,
} as const;
