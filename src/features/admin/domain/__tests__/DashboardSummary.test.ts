import { occupancy, type TableStatus } from '../entities/DashboardSummary';

const table = (id: number): TableStatus => ({
  id,
  number: String(id),
  capacity: 4,
  state: 'libre',
  activeOrders: 0,
});

describe('occupancy', () => {
  it('porcentaje de mesas ocupadas, redondeado', () => {
    const tables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(table);
    expect(occupancy({ occupiedTables: 3, tables })).toBe(25);
    expect(occupancy({ occupiedTables: 1, tables: tables.slice(0, 3) })).toBe(33);
    expect(occupancy({ occupiedTables: 12, tables })).toBe(100);
  });

  it('sin mesas es 0', () => {
    expect(occupancy({ occupiedTables: 0, tables: [] })).toBe(0);
  });
});
