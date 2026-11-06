/** Mesas del salón en administración (Prioridad 1.3), las mismas reglas y datos que la web. */
export const SHAPES: Record<string, string> = {
  cuadrada: 'Cuadrada',
  redonda: 'Redonda',
  rectangular: 'Rectangular',
  barra: 'Barra',
};

export interface AdminTable {
  id: number;
  number: string;
  name: string | null;
  capacity: number;
  shape: string | null;
  areaId: number | null;
  areaName: string | null;
  active: boolean;
  hasHistory: boolean;
  upcomingReservations: number;
}

export interface Area {
  id: number;
  name: string;
}

export interface TableInput {
  number: string;
  name: string | null;
  capacity: number;
  shape: string;
  areaId: number | null;
}

/** Lo que hizo el API con la baja: con historial o reservas activas solo desactiva. */
export interface RemoveResult {
  result: 'eliminada' | 'desactivada';
  message: string;
}

export interface TablesRepository {
  list(): Promise<AdminTable[]>;
  areas(): Promise<Area[]>;
  create(input: TableInput): Promise<void>;
  update(id: number, input: Partial<TableInput> & { active?: boolean }): Promise<void>;
  remove(id: number): Promise<RemoveResult>;
}

/** Las mismas reglas que el API: número obligatorio (hasta 10), capacidad de 1 a 30 y forma válida. */
export class SaveTableUseCase {
  constructor(private readonly repository: TablesRepository) {}

  async execute(input: TableInput, id?: number): Promise<void> {
    const number = input.number.trim();
    if (!number || number.length > 10) throw new Error('Escribe el número de la mesa (hasta 10 caracteres).');
    if (!Number.isInteger(input.capacity) || input.capacity < 1 || input.capacity > 30)
      throw new Error('La capacidad va de 1 a 30 personas.');
    if (!(input.shape in SHAPES)) throw new Error('Elige la forma de la mesa.');
    const clean = { ...input, number, name: input.name?.trim() || null };
    return id === undefined ? this.repository.create(clean) : this.repository.update(id, clean);
  }
}
