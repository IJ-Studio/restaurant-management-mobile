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
  items: { platilloId: number; cantidad: number }[];
  total: number;
  estado: 'pendiente' | 'abierta';
}

type Handler = (body: unknown, param: string) => [status: number, body?: unknown];

const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status });

/** JWT con el formato real (header.payload.firma). La firma es falsa: la app no la valida. */
function makeToken(userId: number): string {
  const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=+$/, '');
  const exp = Math.floor(Date.now() / 1000) + 60 * 60;
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ id: String(userId), exp })}.firma-de-prueba`;
}

export function createFakeApi() {
  const requests: RecordedRequest[] = [];
  const orders = new Map<string, StoredOrder>();
  const reservations: ReservationDto[] = makeTestReservations();
  const tokens = new Set<string>();
  const users = Object.values(testUsers);
  const dishes = testMenu.flatMap((category) => category.platillos);

  const signIn: Handler = (body) => {
    const { email, password } = body as { email?: string; password?: string };
    const user = users.find((u) => u.email === email);
    if (!user || password !== TEST_PASSWORD) return [401, { message: 'Correo o contraseña incorrectos.' }];
    const accessToken = makeToken(user.id);
    tokens.add(accessToken);
    // Como el API real antes del arreglo de seguridad: manda columnas que la app no debe guardar.
    return [200, { accessToken, user: { ...user, password: '$2b$10$hash-de-prueba', loginAttempts: 0 } }];
  };

  const createOrder: Handler = (body) => {
    const { usuarioId, mesa, items } = body as Omit<StoredOrder, 'id' | 'total' | 'estado'>;
    let total = 0;
    for (const item of items) {
      const found = dishes.find((d) => d.id === item.platilloId);
      if (!found || found.disponible === false)
        return [400, { message: `El platillo ${item.platilloId} no está disponible.` }];
      // Como el API real: el precio lo pone el servidor, nunca la app.
      total += Number(found.precio) * item.cantidad;
    }
    const id = `orden-${orders.size + 1}`;
    orders.set(id, { id, usuarioId, mesa, items, total, estado: 'pendiente' });
    return [201, { success: true, message: 'Pedido registrado', ordenId: id, total: total.toFixed(2) }];
  };

  const confirmOrder: Handler = (_body, id) => {
    const order = orders.get(id);
    if (!order) return [404, { message: 'Pedido no encontrado' }];
    order.estado = 'abierta';
    return [200, { success: true, message: 'Pedido enviado a cocina', ordenId: id }];
  };

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
    ['GET', /^menu\/categories\/with-products$/, false, () => [200, testMenu]],
    ['GET', /^menu\/items\/([^/]+)$/, false, dishById],
    ['GET', /^mesas$/, false, () => [200, testTables]],
    ['POST', /^pedidos\/mesa$/, true, createOrder],
    ['POST', /^pedidos\/confirmar\/([^/]+)$/, true, confirmOrder],
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

    for (const [routeMethod, pattern, needsToken, handler] of routes) {
      const match = pattern.exec(path);
      if (routeMethod !== method || !match) continue;
      if (needsToken && !tokens.has(authorization?.replace(/^Bearer /, '') ?? '')) {
        return json(401, { message: 'Unauthorized' });
      }
      const [status, responseBody] = handler(body, match[1] ?? '');
      return json(status, responseBody);
    }
    return json(404, { message: `Cannot ${method} /${path}` });
  };

  const httpClient = new HttpClient({
    baseUrl: 'https://api.pruebas.quijote.mx',
    timeoutMs: 1000,
    allowInsecure: false,
    fetchFn: fetchFn as typeof fetch,
  });

  return { httpClient, requests, orders, reservations };
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
