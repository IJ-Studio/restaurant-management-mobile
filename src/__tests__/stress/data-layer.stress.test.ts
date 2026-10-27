/**
 * Esfuerzo de la capa de datos (httpClient → datasource → mapper → caso de uso) con volumen alto.
 */
import { CYCLES, LIMITS, LOAD } from '../../core/testing/stress/config';
import { heapGrowthOf, measure, writeStressPart } from '../../core/testing/stress/metrics';
import { bigOrder, signedInWaiter } from '../../core/testing/stress/setup';

describe('Esfuerzo: capa de datos con volumen alto', () => {
  afterAll(() => writeStressPart(__filename));

  it(`carga y mapea un menú de ${LOAD.menuDishes} platillos con p95 ≤ ${LIMITS.p95Ms.loadMenu} ms`, async () => {
    // Arrange
    const { deps } = await signedInWaiter();

    // Act
    const result = await measure(
      'Cargar menú (HTTP + mapper + caso de uso)',
      {
        carga: `${LOAD.menuDishes} platillos, ${LOAD.menuCategories} categorías`,
        cycles: CYCLES.dataLayer,
        limitP95Ms: LIMITS.p95Ms.loadMenu,
        heapLimitMb: LIMITS.heapGrowthMb,
      },
      async () => {
        const menu = await deps.getMenuUseCase.execute();
        expect(menu.flatMap((c) => c.dishes)).toHaveLength(LOAD.menuDishes);
      },
    );

    // Assert
    expect(result.p95Ms).toBeLessThanOrEqual(LIMITS.p95Ms.loadMenu);
    expect(heapGrowthOf(result.operacion)).toBeLessThanOrEqual(LIMITS.heapGrowthMb);
  });

  it(`lista ${LOAD.reservations} reservaciones activas con p95 ≤ ${LIMITS.p95Ms.listReservations} ms`, async () => {
    // Arrange
    const { deps } = await signedInWaiter();

    // Act
    const result = await measure(
      'Listar reservaciones activas',
      {
        carga: `${LOAD.reservations} reservaciones`,
        cycles: CYCLES.dataLayer,
        limitP95Ms: LIMITS.p95Ms.listReservations,
      },
      async () => {
        expect(await deps.listActiveReservationsUseCase.execute()).toHaveLength(LOAD.reservations);
      },
    );

    // Assert
    expect(result.p95Ms).toBeLessThanOrEqual(LIMITS.p95Ms.listReservations);
  });

  it(`envía a cocina un pedido de ${LOAD.orderLines} líneas con p95 ≤ ${LIMITS.p95Ms.sendOrder} ms`, async () => {
    // Arrange
    const { api, deps, waiterId } = await signedInWaiter();

    // Act
    const result = await measure(
      'Enviar pedido a cocina',
      { carga: `${LOAD.orderLines} líneas`, cycles: CYCLES.dataLayer, limitP95Ms: LIMITS.p95Ms.sendOrder },
      () => deps.sendOrderToKitchenUseCase.execute(bigOrder(), waiterId),
    );

    // Assert
    expect(result.p95Ms).toBeLessThanOrEqual(LIMITS.p95Ms.sendOrder);
    // + 1 por el ciclo de calentamiento.
    expect(api.orders.size).toBe(CYCLES.dataLayer + 1);
    expect([...api.orders.values()].every((o) => o.items.length === LOAD.orderLines)).toBe(true);
  });

  it(`arma en el store un pedido de ${LOAD.orderLines} líneas con p95 ≤ ${LIMITS.p95Ms.buildOrder} ms`, async () => {
    // Arrange
    const { deps } = await signedInWaiter();
    const store = deps.currentOrderStore;
    const lines = bigOrder().lines;

    // Act: por ciclo, agregar cada platillo, subir su cantidad y elegir mesa.
    const result = await measure(
      'Armar pedido en el store (agregar + cambiar cantidad)',
      {
        carga: `${LOAD.orderLines} platillos × 2 operaciones`,
        cycles: CYCLES.orderBuild,
        limitP95Ms: LIMITS.p95Ms.buildOrder,
      },
      () => {
        store.getState().clear();
        for (const line of lines)
          store.getState().add({ dishId: line.dishId, name: line.name, unitPrice: line.unitPrice });
        for (const line of lines) store.getState().setQuantity(line.dishId, 3);
        store.getState().setTable('7');
      },
    );

    // Assert
    expect(result.p95Ms).toBeLessThanOrEqual(LIMITS.p95Ms.buildOrder);
    expect(store.getState().order.lines).toHaveLength(LOAD.orderLines);
  });
});
