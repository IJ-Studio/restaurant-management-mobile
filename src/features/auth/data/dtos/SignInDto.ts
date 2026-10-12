/** Respuesta de `POST /auth/sign-in`. `user` es la fila de `users`: trae más campos de los que se usan. */
export interface SignInResponseDto {
  accessToken: string;
  user: {
    id: string | number;
    name?: string | null;
    lastname?: string | null;
    email: string;
    roleId: number;
    [key: string]: unknown;
  };
}
