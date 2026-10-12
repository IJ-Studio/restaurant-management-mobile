import type { Table } from '../entities/TableOrder';
import type { OrderRepository } from '../repositories/OrderRepository';

const collator = new Intl.Collator('es', { numeric: true });

/** Mesas activas ordenadas por número ("2" antes que "10"). */
export class ListTablesUseCase {
  constructor(private readonly repository: OrderRepository) {}

  async execute(): Promise<Table[]> {
    const tables = await this.repository.listTables();
    return [...tables].sort((a, b) => collator.compare(a.number, b.number));
  }
}
