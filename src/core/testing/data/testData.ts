/**
 * Datos de prueba compartidos por las pruebas de integración.
 *
 * Tienen la misma forma que las respuestas reales de restaurant-management-api (ver docs/api-endpoints.md),
 * así que recorren los mismos mappers que en producción. Todo es ficticio: los correos usan el dominio
 * `pruebas.quijote.mx` y la contraseña solo existe aquí. Nunca se copian datos reales de clientes.
 */
import type { CategoryWithDishesDto } from '../../../features/menu/data/dtos/MenuDto';
import type { TableDto } from '../../../features/orders/data/dtos/OrderDto';
import type { ReservationDto } from '../../../features/reservations/data/dtos/ReservationDto';

/** Contraseña de todos los usuarios de prueba. */
export const TEST_PASSWORD = 'Prueba#2026';

export interface TestUser {
  id: number;
  name: string;
  lastname: string;
  email: string;
  /** 1 admin, 2 cajero, 3 mesero, 4 cocina (src/common/constants/roles.ts del API). */
  roleId: 1 | 2 | 3 | 4;
}

/** Un usuario por rol del personal. */
export const testUsers = {
  admin: { id: 1, name: 'Andrea', lastname: 'Ruiz', email: 'admin@pruebas.quijote.mx', roleId: 1 },
  cajero: { id: 2, name: 'Carlos', lastname: 'Soto', email: 'cajero@pruebas.quijote.mx', roleId: 2 },
  mesero: { id: 3, name: 'Mariana', lastname: 'Pérez', email: 'mesero@pruebas.quijote.mx', roleId: 3 },
  cocina: { id: 4, name: 'Diego', lastname: 'Luna', email: 'cocina@pruebas.quijote.mx', roleId: 4 },
} satisfies Record<string, TestUser>;

const dish = (
  id: number,
  categoriaId: number,
  nombre: string,
  precio: string,
  extra: Partial<CategoryWithDishesDto['platillos'][number]> = {},
): CategoryWithDishesDto['platillos'][number] => ({
  id,
  categoriaId,
  nombre,
  descripcion: `${nombre} de la casa.`,
  descripcionCorta: null,
  imagenUrl: `https://cdn.pruebas.quijote.mx/platillos/${id}.jpg`,
  precio,
  tiempoPreparacion: 15,
  disponible: true,
  esVegetariano: false,
  esVegano: false,
  esSinGluten: false,
  esPicante: false,
  nivelPicante: 0,
  esPopular: false,
  esNuevo: false,
  esDelChef: false,
  orden: id,
  // Campos internos que el API manda y la app debe descartar.
  precioCosto: '10.00',
  notasCocina: 'Dato interno de cocina',
  ...extra,
});

/** Menú: 3 categorías activas, 1 inactiva y 1 platillo agotado. */
export const testMenu: CategoryWithDishesDto[] = [
  {
    id: 1,
    nombre: 'Entradas',
    orden: 1,
    activa: true,
    platillos: [
      dish(101, 1, 'Guacamole', '95.00', { esVegano: true }),
      dish(102, 1, 'Sopa de tortilla', '85.00'),
    ],
  },
  {
    id: 2,
    nombre: 'Platos fuertes',
    orden: 2,
    activa: true,
    platillos: [
      dish(201, 2, 'Enchiladas suizas', '145.50', { esPopular: true }),
      dish(202, 2, 'Mole poblano', '160.00', { disponible: false }),
    ],
  },
  { id: 3, nombre: 'Bebidas', orden: 3, activa: true, platillos: [dish(301, 3, 'Café de olla', '45.00')] },
  {
    id: 4,
    nombre: 'Temporada',
    orden: 4,
    activa: false,
    platillos: [dish(401, 4, 'Chiles en nogada', '210.00')],
  },
];

/** Mesas: la 8 está inactiva y no debe aparecer en la app. */
export const testTables: TableDto[] = [
  { id: 1, numero: '10', nombre: null, capacidad: 6, activa: true },
  { id: 2, numero: '2', nombre: null, capacidad: 2, activa: true },
  { id: 3, numero: '5', nombre: 'Terraza', capacidad: 4, activa: true },
  { id: 4, numero: '8', nombre: null, capacidad: 4, activa: false },
];

/** Reservaciones de mañana a las 14:00 y 20:00, y una cancelada que no debe listarse. */
export function makeTestReservations(now: Date = new Date()): ReservationDto[] {
  const tomorrowAt = (hours: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + 1);
    date.setHours(hours, 0, 0, 0);
    return date.toISOString();
  };
  const base = {
    clienteTelefono: '55 0000 0000',
    ocasion: null,
    peticionesEspeciales: null,
    canal: 'telefono',
  };
  return [
    {
      ...base,
      id: 'res-1',
      mesaId: 3,
      clienteNombre: 'Cliente Prueba Uno',
      clienteEmail: 'uno@pruebas.quijote.mx',
      fechaHora: tomorrowAt(14),
      numComensales: 4,
      estatus: 'confirmada',
    },
    {
      ...base,
      id: 'res-2',
      mesaId: null,
      clienteNombre: 'Cliente Prueba Dos',
      clienteEmail: 'dos@pruebas.quijote.mx',
      fechaHora: tomorrowAt(20),
      numComensales: 2,
      estatus: 'pendiente',
    },
    {
      ...base,
      id: 'res-3',
      mesaId: 1,
      clienteNombre: 'Cliente Cancelado',
      clienteEmail: 'tres@pruebas.quijote.mx',
      fechaHora: tomorrowAt(15),
      numComensales: 6,
      estatus: 'cancelada',
    },
  ];
}
