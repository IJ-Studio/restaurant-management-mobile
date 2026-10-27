/**
 * Generadores de datos de volumen para las pruebas de rendimiento (src/__perf__) y de esfuerzo
 * (src/__tests__/stress). Producen la misma forma que el API real a partir de `testData.ts`,
 * con nombres y precios deterministas para que dos corridas midan exactamente lo mismo.
 */
import type { CategoryWithDishesDto } from '../../../features/menu/data/dtos/MenuDto';
import type { TableDto } from '../../../features/orders/data/dtos/OrderDto';
import type { OrderLine } from '../../../features/orders/domain/entities/TableOrder';
import type { ReservationDto } from '../../../features/reservations/data/dtos/ReservationDto';
import { testMenu } from './testData';

const template = testMenu[0].platillos[0];

/** Menú con `dishCount` platillos repartidos en `categoryCount` categorías; 1 de cada 10 agotado. */
export function makeMenu(dishCount: number, categoryCount = 10): CategoryWithDishesDto[] {
  return Array.from({ length: categoryCount }, (_, c) => {
    const id = c + 1;
    const perCategory = Math.ceil(dishCount / categoryCount);
    const platillos = Array.from({ length: perCategory }, (_, d) => d + c * perCategory)
      .filter((n) => n < dishCount)
      .map((n) => ({
        ...template,
        id: 10_000 + n,
        categoriaId: id,
        nombre: `Platillo ${n + 1}`,
        descripcion: `Descripción del platillo ${n + 1}.`,
        imagenUrl: `https://cdn.pruebas.quijote.mx/platillos/${10_000 + n}.jpg`,
        precio: (50 + (n % 200)).toFixed(2),
        disponible: n % 10 !== 9,
        orden: n,
      }));
    return { id, nombre: `Categoría ${id}`, orden: id, activa: true, platillos };
  });
}

/** Mesas activas numeradas del 1 al `count`. */
export function makeTables(count: number): TableDto[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    numero: String(i + 1),
    nombre: null,
    capacidad: 2 + (i % 6),
    activa: true,
  }));
}

/** `count` reservaciones de mañana entre las 13:00 y las 22:59, una cada minuto aprox. */
export function makeReservations(count: number, now: Date = new Date()): ReservationDto[] {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() + 1);
    date.setHours(13 + (Math.floor(i / 60) % 10), i % 60, 0, 0);
    return {
      id: `carga-${i + 1}`,
      mesaId: i % 3 === 0 ? null : (i % 20) + 1,
      clienteNombre: `Cliente Carga ${i + 1}`,
      clienteTelefono: '55 0000 0000',
      clienteEmail: `carga${i + 1}@pruebas.quijote.mx`,
      fechaHora: date.toISOString(),
      numComensales: 1 + (i % 8),
      ocasion: null,
      peticionesEspeciales: null,
      estatus: i % 4 === 0 ? 'pendiente' : 'confirmada',
      canal: 'telefono',
    };
  });
}

/** Pedido de la mesa con `count` platillos distintos y disponibles del menú de carga. */
export function makeOrderLines(count: number): OrderLine[] {
  const lines: OrderLine[] = [];
  // En makeMenu uno de cada 10 platillos está agotado (n % 10 === 9): esos no se piden.
  for (let n = 0; lines.length < count; n++) {
    if (n % 10 === 9) continue;
    lines.push({
      dishId: 10_000 + n,
      name: `Platillo ${n + 1}`,
      unitPrice: 50 + (n % 200),
      quantity: 1 + (n % 3),
    });
  }
  return lines;
}
