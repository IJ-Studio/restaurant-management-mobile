/**
 * Arranque de las pruebas de esfuerzo: API falso con el volumen de LOAD y el grafo de dependencias
 * real con una sesión iniciada.
 */
import { createDependencies } from '../../di/dependencies';
import { makeMenu, makeOrderLines, makeReservations, makeTables } from '../data/loadData';
import { TEST_PASSWORD, testUsers } from '../data/testData';
import { createFakeApi, createMemorySessionStorage, type FakeApiOptions } from '../fakeApi';
import { LOAD } from './config';

// El esfuerzo tarda más que los 5 s por defecto de Jest.
jest.setTimeout(180_000);

export function createLoadedApi(options: FakeApiOptions = {}) {
  return createFakeApi({
    menu: makeMenu(LOAD.menuDishes, LOAD.menuCategories),
    tables: makeTables(LOAD.tables),
    reservations: makeReservations(LOAD.reservations),
    ...options,
  });
}

/** Dependencias reales contra el API de carga, con la sesión del mesero ya iniciada. */
export async function signedInWaiter(options: FakeApiOptions = {}) {
  const api = createLoadedApi(options);
  const deps = createDependencies({
    httpClient: api.httpClient,
    sessionStorage: createMemorySessionStorage(),
  });
  const session = await deps.loginUseCase.execute({ email: testUsers.mesero.email, password: TEST_PASSWORD });
  deps.sessionStore.getState().setSession(session);
  return { api, deps, waiterId: Number(session.user.id) };
}

/** Pedido de LOAD.orderLines platillos para la mesa 1. */
export const bigOrder = () => ({ tableNumber: '1', lines: makeOrderLines(LOAD.orderLines) });
