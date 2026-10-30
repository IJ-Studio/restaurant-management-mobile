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
  estado: 'pendiente' | 'abierta' | 'en_preparacion' | 'lista' | 'entregada' | 'pagada' | 'cancelada';
  propina: number;
  tiempoApertura: string;
}

type TestUser = (typeof testUsers)[keyof typeof testUsers];
type Handler = (
  body: unknown,
  param: string,
  query: URLSearchParams,
  user: TestUser | undefined,
) => [status: number, body?: unknown];

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
  /** Token → usuario: las rutas con roles saben quién llama, como el JWT del API. */
  const tokens = new Map<string, TestUser>();
  // Copias: editar el perfil en una prueba no debe cambiar los datos de las demás.
  const users: TestUser[] = Object.values(testUsers).map((user) => ({ ...user }));
  const phones = new Map<number, string>();
  const passwords = new Map<number, string>();
  const dishes = menu.flatMap((category) => category.platillos);
  const faults = createFaults();

  const signIn: Handler = (body) => {
    const { email, password } = body as { email?: string; password?: string };
    const user = users.find((u) => u.email === email);
    if (!user || password !== (passwords.get(user.id) ?? TEST_PASSWORD))
      return [401, { message: 'Correo o contraseña incorrectos.' }];
    const accessToken = makeToken(user.id);
    tokens.set(accessToken, user);
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
      propina: 0,
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

  // Como el API: solo los pedidos activos (sin cancelados ni pagados), el más reciente primero.
  const recentOrders: Handler = () => [
    200,
    [...orders.values()]
      .filter((order) => order.estado !== 'cancelada' && order.estado !== 'pagada')
      .reverse()
      .map((order) => ({
        id: order.id,
        customer: 'Cliente de mesa',
        time: '08:00 p.m.',
        item: dishName(order.items[0]?.platilloId ?? -1) ?? '—',
        table: `Mesa ${order.mesa}`,
        status: order.estado,
        total: order.total,
        openedAt: order.tiempoApertura,
        items: order.items.map((item) => ({ nombre: dishName(item.platilloId), cantidad: item.cantidad })),
      })),
  ];

  const orderDetail: Handler = (_body, id) => {
    const order = orders.get(id);
    if (!order) return [404, { message: 'El pedido no existe.' }];
    return [
      200,
      {
        id: order.id,
        tipo: 'mesa',
        mesa: order.mesa,
        estatus: order.estado,
        subtotal: order.total.toFixed(2),
        propina: order.propina.toFixed(2),
        total: order.total.toFixed(2),
        notasCocina: null,
        tiempoApertura: order.tiempoApertura.replace('T', ' ').replace('Z', '+00'),
        items: order.items.map((item) => ({
          id: item.id,
          cantidad: item.cantidad,
          precioUnitario: String(dishes.find((d) => d.id === item.platilloId)?.precio ?? '0'),
          notas: null,
          platillo: { nombre: dishName(item.platilloId), imagenUrl: null },
        })),
      },
    ];
  };

  // Mismas reglas que OrderWorkflowService del API.
  const STEPS: Record<string, { from: string[]; roles: number[] }> = {
    en_preparacion: { from: ['abierta'], roles: [1, 4] },
    lista: { from: ['abierta', 'en_preparacion'], roles: [1, 4] },
    entregada: { from: ['lista'], roles: [1, 2, 3] },
  };

  const changeStatus: Handler = (body, id, _query, user) => {
    const { estatus } = body as { estatus: string };
    const step = STEPS[estatus];
    if (!step) return [400, { message: ['estatus no válido'] }];
    if (!user || !step.roles.includes(user.roleId)) return [403, { message: 'Forbidden resource' }];
    const order = orders.get(id);
    if (!order) return [404, { message: 'El pedido no existe.' }];
    if (!step.from.includes(order.estado))
      return [400, { message: `El pedido está en "${order.estado}" y no puede pasar a "${estatus}".` }];
    order.estado = estatus as StoredOrder['estado'];
    return [200, { success: true, message: 'Pedido actualizado.', ordenId: id, estatus }];
  };

  const paymentMethods = [
    { id: 1, nombre: 'Efectivo', tipo: 'efectivo', aplicaPropina: true, esEfectivo: true },
    { id: 2, nombre: 'Tarjeta débito', tipo: 'tarjeta', aplicaPropina: true, esEfectivo: false },
  ];
  const cashierOnly = (user: TestUser | undefined) => !user || ![1, 2].includes(user.roleId);

  const listPaymentMethods: Handler = (_body, _id, _query, user) =>
    cashierOnly(user) ? [403, { message: 'Forbidden resource' }] : [200, paymentMethods];

  const chargeOrder: Handler = (body, id, _query, user) => {
    if (cashierOnly(user)) return [403, { message: 'Forbidden resource' }];
    const {
      metodoPagoId,
      propina = 0,
      montoRecibido,
    } = body as {
      metodoPagoId: number;
      propina?: number;
      montoRecibido?: number;
    };
    const order = orders.get(id);
    if (!order) return [404, { message: 'El pedido no existe.' }];
    if (order.estado === 'pagada') return [409, { message: 'Este pedido ya está pagado.' }];
    if (!['abierta', 'en_preparacion', 'lista', 'entregada'].includes(order.estado))
      return [400, { message: `Este pedido no se puede cobrar (estatus actual: ${order.estado}).` }];
    const method = paymentMethods.find((m) => m.id === metodoPagoId);
    if (!method) return [400, { message: 'Elige un método de pago válido para cobrar en caja.' }];
    const toPay = order.total + propina;
    if (method.esEfectivo && (montoRecibido ?? 0) < toPay)
      return [400, { message: 'El efectivo recibido no alcanza.' }];
    order.estado = 'pagada';
    order.propina = propina;
    const change = method.esEfectivo ? (montoRecibido ?? 0) - toPay : 0;
    return [
      201,
      {
        success: true,
        message: 'Pago registrado. El pedido quedó cerrado.',
        ordenId: id,
        metodo: method.nombre,
        total: order.total.toFixed(2),
        propina: propina.toFixed(2),
        totalCobrado: toPay.toFixed(2),
        cambio: change.toFixed(2),
      },
    ];
  };

  // Incidencias de cocina, como las guarda el API en la bitácora.
  const incidents: unknown[] = [];
  const reportIncident: Handler = (body, _id, _query, user) => {
    const { tipo, ordenId, mensaje, minutos } = body as Record<string, unknown>;
    const order = typeof ordenId === 'string' ? orders.get(ordenId) : undefined;
    incidents.unshift({
      id: String(incidents.length + 1),
      ordenId: ordenId ?? null,
      tipo,
      mensaje: mensaje ?? null,
      minutos: minutos ?? null,
      mesa: order?.mesa ?? null,
      reportadoPor: user ? `${user.name} ${user.lastname}` : null,
      creadoEn: new Date().toISOString(),
    });
    return [201, { success: true, message: 'Incidencia reportada.' }];
  };

  const userDto = (user: TestUser) => ({ ...user, phone: phones.get(user.id) ?? null, isActive: true });
  const ownUser = (id: string, user: TestUser | undefined) =>
    user && (String(user.id) === id || user.roleId === 1)
      ? users.find((u) => String(u.id) === id)
      : undefined;

  const getUser: Handler = (_body, id, _query, user) => {
    const found = ownUser(id, user);
    return found ? [200, userDto(found)] : [403, { message: 'No tienes permisos para ver este usuario' }];
  };

  const updateUser: Handler = (body, id, _query, user) => {
    const found = ownUser(id, user);
    if (!found) return [403, { message: 'No tienes permisos para actualizar este usuario' }];
    const { name, lastname, phone } = body as { name?: string; lastname?: string; phone?: string };
    if (phone !== undefined && !/^\+[1-9]\d{9,14}$/.test(phone))
      return [400, { message: ['phone must be in international format: "+" followed by 10 to 15 digits'] }];
    if (name) found.name = name;
    if (lastname) found.lastname = lastname;
    if (phone) phones.set(found.id, phone);
    return [200, userDto(found)];
  };

  const changePassword: Handler = (body, id, _query, user) => {
    if (!user || String(user.id) !== id)
      return [403, { message: 'Solo puedes cambiar tu propia contraseña' }];
    const { currentPassword, newPassword } = body as { currentPassword: string; newPassword: string };
    if (currentPassword !== (passwords.get(user.id) ?? TEST_PASSWORD))
      return [400, { message: 'La contraseña actual no es correcta' }];
    passwords.set(user.id, newPassword);
    return [200, { message: 'Contraseña actualizada correctamente' }];
  };

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
        pedidosEnPreparacion: active.filter((order) => ['abierta', 'en_preparacion'].includes(order.estado))
          .length,
        pedidosListos: active.filter((order) => order.estado === 'lista').length,
        pedidosPorCobrar: active.filter((order) => order.estado === 'entregada').length,
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
    ['GET', /^pedidos\/metodos-pago$/, true, listPaymentMethods],
    ['PATCH', /^pedidos\/([^/]+)\/estatus$/, true, changeStatus],
    ['POST', /^pedidos\/([^/]+)\/cobrar$/, true, chargeOrder],
    ['GET', /^pedidos\/([^/]+)$/, true, orderDetail],
    ['GET', /^cocina\/incidencias$/, true, () => [200, incidents]],
    ['POST', /^cocina\/incidencias$/, true, reportIncident],
    ['GET', /^inventario\/mermas$/, true, () => [200, []]],
    ['GET', /^caja\/actual$/, true, () => [200, { abierta: false }]],
    ['GET', /^users\/([^/]+)$/, true, getUser],
    ['PATCH', /^users\/([^/]+)\/password$/, true, changePassword],
    ['PATCH', /^users\/([^/]+)$/, true, updateUser],
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
      const user = tokens.get(authorization?.replace(/^Bearer /, '') ?? '');
      if (needsToken && !user) {
        return json(401, { message: 'Unauthorized' });
      }
      const [status, responseBody] = handler(body, match[1] ?? '', url.searchParams, user);
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
