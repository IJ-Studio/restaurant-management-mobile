/**
 * API falso para las pruebas de integración.
 *
 * Responde como restaurant-management-api (mismas rutas, códigos y forma del JSON) a partir de los datos
 * de `data/testData.ts`. Se conecta al `HttpClient` real con `fetchFn`, así la prueba recorre
 * httpClient → datasource → mapper → repositorio → caso de uso → ViewModel → pantalla, sin red.
 * Guarda cada petición en `requests` para verificar lo que la app mandó.
 */
import type { Session } from '../../features/auth/domain/entities/Session';
import type { SessionStorage } from '../../features/auth/domain/repositories/SessionStorage';
import type { CategoryWithDishesDto } from '../../features/menu/data/dtos/MenuDto';
import type { TableDto } from '../../features/orders/data/dtos/OrderDto';
import type { ReservationDto } from '../../features/reservations/data/dtos/ReservationDto';
import { HttpClient } from '../http/httpClient';
import { makeTestReservations, TEST_PASSWORD, testMenu, testTables, testUsers } from './data/testData';

export interface RecordedRequest {
  method: string;
  path: string;
  body: unknown;
  authorization: string | null;
}

interface StoredOrder {
  id: string;
  usuarioId: number;
  mesa: string;
  /** `id` es el de la fila en orden_items (el que usa DELETE /pedidos/item/:id). */
  items: { id: number; platilloId: number; cantidad: number }[];
  total: number;
  estado: 'pendiente' | 'abierta' | 'cancelada';
  tiempoApertura: string;
}

type Handler = (body: unknown, param: string, query: URLSearchParams) => [status: number, body?: unknown];

const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status });

/** JWT con el formato real (header.payload.firma). La firma es falsa: la app no la valida. */
function makeToken(userId: number): string {
  const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=+$/, '');
  const exp = Math.floor(Date.now() / 1000) + 60 * 60;
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ id: String(userId), exp })}.firma-de-prueba`;
}

export interface FakeApiOptions {
  /** Datos de volumen para las pruebas de esfuerzo; por defecto, los de testData.ts. */
  menu?: CategoryWithDishesDto[];
  tables?: TableDto[];
  reservations?: ReservationDto[];
  /** Tiempo límite del HttpClient (ms). */
  timeoutMs?: number;
}

/**
 * Fallas que se pueden inyectar en el API falso (pruebas de esfuerzo): latencia en cada respuesta,
 * N respuestas con error del servidor y N peticiones que nunca responden (el HttpClient las corta
 * por tiempo límite).
 */
export interface FaultInjector {
  latencyMs: number;
  /** Las siguientes `count` peticiones (opcionalmente solo las que coinciden con `match`) fallan con `status`. */
  failNext: (count: number, status?: number, match?: RegExp) => void;
  /** Las siguientes `count` peticiones nunca responden: el HttpClient las corta por tiempo límite. */
  hangNext: (count: number, match?: RegExp) => void;
  reset: () => void;
}

function createFaults(): FaultInjector & { take: (path: string) => 'ok' | 'hang' | number } {
  let failures = 0;
  let failStatus = 503;
  let failMatch: RegExp | undefined;
  let hangs = 0;
  let hangMatch: RegExp | undefined;
  return {
    latencyMs: 0,
    failNext(count, status = 503, match) {
      failures = count;
      failStatus = status;
      failMatch = match;
    },
    hangNext(count, match) {
      hangs = count;
      hangMatch = match;
    },
    reset() {
      this.latencyMs = 0;
      failures = 0;
      hangs = 0;
    },
    take(path) {
      if (hangs > 0 && (!hangMatch || hangMatch.test(path))) {
        hangs -= 1;
        return 'hang';
      }
      if (failures > 0 && (!failMatch || failMatch.test(path))) {
        failures -= 1;
        return failStatus;
      }
      return 'ok';
    },
  };
}

/** Espera `ms` o hasta que se cancele la petición (como un socket real). */
function wait(ms: number, signal?: AbortSignal | null): Promise<void> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(new Error('aborted'));
    if (signal?.aborted) return abort();
    const timer = ms === Infinity ? undefined : setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      abort();
    });
  });
}

export function createFakeApi(options: FakeApiOptions = {}) {
  const menu = options.menu ?? testMenu;
  const tables = options.tables ?? testTables;
  const requests: RecordedRequest[] = [];
  const orders = new Map<string, StoredOrder>();
  const reservations: ReservationDto[] = options.reservations ?? makeTestReservations();
  const tokens = new Set<string>();
  const users = Object.values(testUsers);
  const dishes = menu.flatMap((category) => category.platillos);
  const faults = createFaults();

  const signIn: Handler = (body) => {
    const { email, password } = body as { email?: string; password?: string };
    const user = users.find((u) => u.email === email);
    if (!user || password !== TEST_PASSWORD) return [401, { message: 'Correo o contraseña incorrectos.' }];
    const accessToken = makeToken(user.id);
    tokens.add(accessToken);
    // Como el API real antes del arreglo de seguridad: manda columnas que la app no debe guardar.
    return [200, { accessToken, user: { ...user, password: '$2b$10$hash-de-prueba', loginAttempts: 0 } }];
  };

  let nextItemId = 1;

  const createOrder: Handler = (body) => {
    const { usuarioId, mesa, items } = body as {
      usuarioId: number;
      mesa: string;
      items: { platilloId: number; cantidad: number }[];
    };
    let total = 0;
    for (const item of items) {
      const found = dishes.find((d) => d.id === item.platilloId);
      if (!found || found.disponible === false)
        return [400, { message: `El platillo ${item.platilloId} no está disponible.` }];
      // Como el API real: el precio lo pone el servidor, nunca la app.
      total += Number(found.precio) * item.cantidad;
    }
    const id = `orden-${orders.size + 1}`;
    orders.set(id, {
      id,
      usuarioId,
      mesa,
      items: items.map((item) => ({ ...item, id: nextItemId++ })),
      total,
      estado: 'pendiente',
      tiempoApertura: new Date().toISOString(),
    });
    return [201, { success: true, message: 'Pedido registrado', ordenId: id, total: total.toFixed(2) }];
  };

  const confirmOrder: Handler = (_body, id) => {
    const order = orders.get(id);
    if (!order) return [404, { message: 'Pedido no encontrado' }];
    order.estado = 'abierta';
    order.tiempoApertura = new Date().toISOString();
    return [200, { success: true, message: 'Pedido enviado a cocina', ordenId: id }];
  };

  const dishName = (platilloId: number) => dishes.find((d) => d.id === platilloId)?.nombre ?? null;
  const recalculate = (order: StoredOrder) => {
    order.total = order.items.reduce(
      (sum, item) => sum + Number(dishes.find((d) => d.id === item.platilloId)?.precio ?? 0) * item.cantidad,
      0,
    );
  };

  // Como el API: solo los pedidos activos (sin cancelados), el más reciente primero.
  const recentOrders: Handler = () => [
    200,
    [...orders.values()]
      .filter((order) => order.estado !== 'cancelada')
      .reverse()
      .map((order) => ({
        id: order.id,
        customer: 'Cliente de mesa',
        time: '08:00 p.m.',
        item: dishName(order.items[0]?.platilloId ?? -1) ?? '—',
        table: `Mesa ${order.mesa}`,
        status: order.estado,
        total: order.total,
      })),
  ];

  const ordersByTable: Handler = (_body, _param, query) => {
    const mesa = query.get('mesaId');
    if (!mesa) return [400, { message: 'Debes indicar mesaId o tipo=domicilio.' }];
    return [
      200,
      [...orders.values()]
        .filter((order) => order.mesa === mesa)
        .map((order) => ({
          id: order.id,
          mesaId: order.mesa,
          estatus: order.estado,
          total: order.total.toFixed(2),
          tiempoApertura: order.tiempoApertura.replace('T', ' ').replace('Z', '+00'),
          ordenItems: order.items.map((item) => ({
            id: item.id,
            cantidad: item.cantidad,
            precioUnitario: String(dishes.find((d) => d.id === item.platilloId)?.precio ?? '0'),
            platillo: { nombre: dishName(item.platilloId), imagenUrl: null },
          })),
        })),
    ];
  };

  const cancelOrder: Handler = (_body, id) => {
    const order = orders.get(id);
    if (!order) return [404, { message: `La orden con ID ${id} no existe.` }];
    if (order.estado !== 'abierta')
      return [400, { message: `No se puede cancelar una comanda en estado: ${order.estado}.` }];
    order.estado = 'cancelada';
    return [200, { success: true, message: 'Tu comanda ha sido cancelada con éxito.' }];
  };

  const removeItem: Handler = (_body, id) => {
    const order = [...orders.values()].find((o) => o.items.some((item) => String(item.id) === id));
    if (!order) return [404, { message: `El producto con ID ${id} no existe en ningún pedido.` }];
    if (order.estado !== 'pendiente')
      return [400, { message: 'Este producto ya no se puede quitar porque el pedido ya fue confirmado.' }];
    order.items = order.items.filter((item) => String(item.id) !== id);
    recalculate(order);
    return [200, { success: true, message: 'Producto eliminado de tu pedido.', ordenId: order.id }];
  };

  const adminStats: Handler = () => {
    const active = [...orders.values()].filter((order) => order.estado !== 'cancelada');
    return [
      200,
      {
        totalVentas: active.reduce((sum, order) => sum + order.total, 0),
        pedidosPendientes: active.filter((order) => order.estado === 'pendiente').length,
        pedidosEnPreparacion: active.filter((order) => order.estado === 'abierta').length,
        mesasOcupadas: 0,
        mesasLibres: tables.length,
        totalMesas: tables.length,
      },
    ];
  };

  const tableMap: Handler = () => [
    200,
    tables
      .filter((table) => table.activa !== false)
      .map((table) => ({
        id: table.id,
        numero: table.numero,
        capacidad: table.capacidad,
        areaNombre: 'Salón',
        estado: 'disponible',
      })),
  ];

  const createReservation: Handler = (body) => {
    const created = {
      ...(body as ReservationDto),
      id: `res-${reservations.length + 1}`,
      mesaId: null,
      estatus: 'pendiente',
    };
    reservations.push(created);
    return [201, { ...created, requiereConfirmacion: true, mensaje: 'Reservación registrada.' }];
  };

  const dishById: Handler = (_body, id) => {
    const found = dishes.find((d) => String(d.id) === id);
    return found ? [200, found] : [404, { message: 'Platillo no encontrado' }];
  };

  /** [método, ruta, ¿pide JWT?, handler]. `:id` toma el último segmento de la ruta. */
  const routes: [string, RegExp, boolean, Handler][] = [
    ['POST', /^auth\/sign-in$/, false, signIn],
    ['POST', /^auth\/sign-out$/, true, () => [200, { message: 'Sesión cerrada' }]],
    ['GET', /^menu\/categories\/with-products$/, false, () => [200, menu]],
    ['GET', /^menu\/items\/([^/]+)$/, false, dishById],
    ['GET', /^mesas$/, false, () => [200, tables]],
    ['POST', /^pedidos\/mesa$/, true, createOrder],
    ['POST', /^pedidos\/confirmar\/([^/]+)$/, true, confirmOrder],
    ['GET', /^pedidos\/admin\/recent$/, true, recentOrders],
    ['GET', /^pedidos\/usuario$/, true, ordersByTable],
    ['PATCH', /^pedidos\/cancelar\/([^/]+)$/, true, cancelOrder],
    ['DELETE', /^pedidos\/item\/([^/]+)$/, true, removeItem],
    ['GET', /^dashboard\/admin\/stats$/, true, adminStats],
    ['GET', /^reservations\/map$/, false, tableMap],
    ['GET', /^reservations$/, true, () => [200, reservations]],
    ['POST', /^reservations$/, false, createReservation],
  ];

  const fetchFn = async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
    const url = new URL(String(input));
    const path = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
    const method = init.method ?? 'GET';
    const headers = (init.headers ?? {}) as Record<string, string>;
    const authorization = headers.Authorization ?? null;
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    requests.push({ method, path, body, authorization });

    const fault = faults.take(path);
    if (fault === 'hang') await wait(Infinity, init.signal);
    if (faults.latencyMs > 0) await wait(faults.latencyMs, init.signal);
    if (typeof fault === 'number') return json(fault, { message: 'Service Unavailable', statusCode: fault });

    for (const [routeMethod, pattern, needsToken, handler] of routes) {
      const match = pattern.exec(path);
      if (routeMethod !== method || !match) continue;
      if (needsToken && !tokens.has(authorization?.replace(/^Bearer /, '') ?? '')) {
        return json(401, { message: 'Unauthorized' });
      }
      const [status, responseBody] = handler(body, match[1] ?? '', url.searchParams);
      return json(status, responseBody);
    }
    return json(404, { message: `Cannot ${method} /${path}` });
  };

  const httpClient = new HttpClient({
    baseUrl: 'https://api.pruebas.quijote.mx',
    timeoutMs: options.timeoutMs ?? 1000,
    allowInsecure: false,
    fetchFn: fetchFn as typeof fetch,
  });

  return { httpClient, requests, orders, reservations, faults: faults as FaultInjector };
}

/** Sustituto de SecureSessionStorage: guarda la sesión en memoria y permite revisar qué se guardó. */
export function createMemorySessionStorage(): SessionStorage & { saved: () => Session | null } {
  let stored: Session | null = null;
  return {
    save: async (session) => {
      stored = JSON.parse(JSON.stringify(session)) as Session;
    },
    load: async () => stored,
    clear: async () => {
      stored = null;
    },
    saved: () => stored,
  };
}
