/** Variables públicas de la app. Solo EXPO_PUBLIC_*: todo lo que esté aquí termina en el bundle. */
export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? '',
  httpTimeoutMs: 15000,
} as const;
