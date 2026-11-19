/**
 * Respuesta de POST /auth/sign-in y POST /auth/refresh. `user` es la fila completa de `users`
 * (incluye datos que la app descarta).
 */
export interface SignInResponseDto {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: number;
    name: string;
    lastname: string;
    email: string;
    roleId: number;
    [extra: string]: unknown;
  };
}
