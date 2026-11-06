import type { HttpClient } from '../../../../core/http/httpClient';
import type { AdminTable, Area, RemoveResult, TableInput, TablesRepository } from '../domain/Tables';

interface TableDto {
  id: number;
  numero: string;
  nombre: string | null;
  capacidad: number;
  forma: string | null;
  areaId: number | null;
  areaNombre: string | null;
  activa: boolean | null;
  conHistorial: boolean;
  reservasActivas: number;
}

const body = (t: Partial<TableInput> & { active?: boolean }) =>
  Object.fromEntries(
    Object.entries({
      numero: t.number,
      nombre: t.name,
      capacidad: t.capacity,
      forma: t.shape,
      areaId: t.areaId,
      activa: t.active,
    }).filter(([, v]) => v !== undefined),
  );

/** GET /mesas/admin, GET /mesas/admin/areas, POST /mesas/admin, PATCH y DELETE /mesas/admin/:id (solo admin). */
export class TablesRepositoryImpl implements TablesRepository {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<AdminTable[]> {
    const rows = await this.http.get<TableDto[]>('mesas/admin');
    return rows.map((r) => ({
      id: r.id,
      number: r.numero,
      name: r.nombre,
      capacity: r.capacidad,
      shape: r.forma,
      areaId: r.areaId,
      areaName: r.areaNombre,
      active: r.activa !== false,
      hasHistory: r.conHistorial,
      upcomingReservations: r.reservasActivas,
    }));
  }

  async areas(): Promise<Area[]> {
    const rows = await this.http.get<{ id: number; nombre: string }[]>('mesas/admin/areas');
    return rows.map((a) => ({ id: a.id, name: a.nombre }));
  }

  async create(input: TableInput): Promise<void> {
    await this.http.post('mesas/admin', body(input));
  }

  async update(id: number, input: Partial<TableInput> & { active?: boolean }): Promise<void> {
    await this.http.patch(`mesas/admin/${id}`, body(input));
  }

  async remove(id: number): Promise<RemoveResult> {
    const r = await this.http.delete<{ resultado: RemoveResult['result']; message: string }>(
      `mesas/admin/${id}`,
    );
    return { result: r.resultado, message: r.message };
  }
}
