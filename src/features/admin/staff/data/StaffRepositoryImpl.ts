import type { HttpClient } from '../../../../core/http/httpClient';
import type { StaffInput, StaffMember, StaffRepository } from '../domain/Staff';

interface UserDto {
  id: number | string;
  name: string;
  lastname: string;
  email: string;
  phone?: string | null;
  roleId: number;
  isActive: boolean;
}

/** GET/POST /users, PATCH /users/:id, /users/:id/role y /users/:id/reactivar, DELETE /users/:id (baja lógica). */
export class StaffRepositoryImpl implements StaffRepository {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<StaffMember[]> {
    // shortcut: una página de 100; paginar con X-Next-Cursor si el personal pasa de 100.
    const rows = await this.http.get<UserDto[]>('users?incluirInactivos=true&limit=100');
    return rows.map((u) => ({
      id: Number(u.id),
      name: u.name,
      lastname: u.lastname,
      email: u.email,
      phone: u.phone ?? null,
      roleId: u.roleId,
      active: u.isActive,
    }));
  }

  async create(input: StaffInput): Promise<void> {
    await this.http.post('users', input);
  }

  async update(id: number, changes: { name: string; lastname: string; phone: string }): Promise<void> {
    await this.http.patch(`users/${id}`, changes);
  }

  async changeRole(id: number, roleId: number): Promise<void> {
    await this.http.patch(`users/${id}/role`, { roleId });
  }

  async deactivate(id: number): Promise<void> {
    await this.http.delete(`users/${id}`);
  }

  async reactivate(id: number): Promise<void> {
    await this.http.patch(`users/${id}/reactivar`);
  }
}
