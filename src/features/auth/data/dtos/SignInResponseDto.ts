/** Respuesta de POST /auth/sign-in. `user` es la fila completa de `users` (incluye datos que la app descarta). */
export interface SignInResponseDto {
  accessToken: string;
  user: {
    id: number;
    name: string;
    lastname: string;
    email: string;
    roleId: number;
    [extra: string]: unknown;
  };
}
