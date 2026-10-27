/**
 * Esfuerzo de la interfaz: render repetido de las pantallas con volumen alto de datos.
 */
import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, screen } from '@testing-library/react-native';

import { signInAs } from '../../core/testing/acceptance';
import { makeReservations } from '../../core/testing/data/loadData';
import { makeTestDependencies } from '../../core/testing/makeTestDependencies';
import { renderWithProviders } from '../../core/testing/renderWithProviders';
import { startTestApp } from '../../core/testing/startTestApp';
import { CYCLES, LIMITS, LOAD } from '../../core/testing/stress/config';
import { heapGrowthOf, measure, writeStressPart } from '../../core/testing/stress/metrics';
import { bigOrder, createLoadedApi } from '../../core/testing/stress/setup';
import { toReservation } from '../../features/reservations/data/mappers/reservationMapper';
import { TableOrderScreen } from '../../features/orders/presentation/screens/TableOrderScreen';
import { ReservationsNavigator } from '../../features/reservations/presentation/navigation/ReservationsNavigator';
import { createCurrentOrderStore } from '../../features/orders/presentation/store/currentOrderStore';

describe('Esfuerzo: pantallas con volumen alto', () => {
  afterAll(() => writeStressPart(__filename));

  it(`abre la app y muestra un menú de ${LOAD.menuDishes} platillos con p95 ≤ ${LIMITS.p95Ms.renderMenu} ms`, async () => {
    // Arrange
    const api = createLoadedApi();

    // Act: cada ciclo arranca la app, inicia sesión y espera el menú.
    const result = await measure(
      'Abrir la app e iniciar sesión hasta ver el menú',
      {
        carga: `${LOAD.menuDishes} platillos`,
        cycles: CYCLES.render,
        limitP95Ms: LIMITS.p95Ms.renderMenu,
        heapLimitMb: LIMITS.heapGrowthMb,
      },
      async () => {
        const app = await startTestApp({ api });
        await signInAs('mesero');
        await screen.findByText('Platillo 1');
        await app.unmount();
      },
    );

    // Assert
    expect(result.p95Ms).toBeLessThanOrEqual(LIMITS.p95Ms.renderMenu);
    expect(heapGrowthOf(result.operacion)).toBeLessThanOrEqual(LIMITS.heapGrowthMb);
  });

  it(`busca en un menú de ${LOAD.menuDishes} platillos con p95 ≤ ${LIMITS.p95Ms.searchMenu} ms`, async () => {
    // Arrange
    await startTestApp({ api: createLoadedApi() });
    await signInAs('mesero');
    await screen.findByText('Platillo 1');

    // Act
    const result = await measure(
      'Buscar platillo (filtro local)',
      { carga: `${LOAD.menuDishes} platillos`, cycles: CYCLES.search, limitP95Ms: LIMITS.p95Ms.searchMenu },
      async (cycle) => {
        const n = 1 + ((cycle * 97) % LOAD.menuDishes);
        await fireEvent.changeText(screen.getByLabelText('Buscar platillo'), `Platillo ${n}`);
        await screen.findAllByText(`Platillo ${n}`);
      },
    );

    // Assert
    expect(result.p95Ms).toBeLessThanOrEqual(LIMITS.p95Ms.searchMenu);
  });

  it(`muestra un pedido de ${LOAD.orderLines} líneas con p95 ≤ ${LIMITS.p95Ms.renderOrder} ms`, async () => {
    // Arrange
    const currentOrderStore = createCurrentOrderStore();
    const deps = makeTestDependencies({ currentOrderStore });

    // Act
    const result = await measure(
      'Render del pedido de la mesa',
      {
        carga: `${LOAD.orderLines} líneas`,
        cycles: CYCLES.render,
        limitP95Ms: LIMITS.p95Ms.renderOrder,
        heapLimitMb: LIMITS.heapGrowthMb,
      },
      async () => {
        currentOrderStore.setState({ order: bigOrder() });
        const view = await renderWithProviders(<TableOrderScreen />, deps);
        await screen.findByText('Platillo 1');
        await view.unmount();
      },
    );

    // Assert
    expect(result.p95Ms).toBeLessThanOrEqual(LIMITS.p95Ms.renderOrder);
    expect(heapGrowthOf(result.operacion)).toBeLessThanOrEqual(LIMITS.heapGrowthMb);
  });

  it(`lista ${LOAD.reservations} reservaciones con p95 ≤ ${LIMITS.p95Ms.renderReservations} ms`, async () => {
    // Arrange
    const reservations = makeReservations(LOAD.reservations).map(toReservation);
    const deps = makeTestDependencies({
      listActiveReservationsUseCase: { execute: () => Promise.resolve(reservations) },
    });

    // Act
    const result = await measure(
      'Render del listado de reservaciones',
      {
        carga: `${LOAD.reservations} reservaciones`,
        cycles: CYCLES.render,
        limitP95Ms: LIMITS.p95Ms.renderReservations,
        heapLimitMb: LIMITS.heapGrowthMb,
      },
      async () => {
        const view = await renderWithProviders(
          <NavigationContainer>
            <ReservationsNavigator />
          </NavigationContainer>,
          deps,
        );
        await screen.findByText('Cliente Carga 1');
        await view.unmount();
      },
    );

    // Assert
    expect(result.p95Ms).toBeLessThanOrEqual(LIMITS.p95Ms.renderReservations);
    expect(heapGrowthOf(result.operacion)).toBeLessThanOrEqual(LIMITS.heapGrowthMb);
  });
});
