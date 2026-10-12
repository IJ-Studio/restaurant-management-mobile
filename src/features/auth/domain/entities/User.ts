import type { Role } from './Role';

export interface User {
  id: string;
  name: string;
  lastname: string;
  email: string;
  role: Role;
}
