/**
 * Esfuerzo por ráfagas: muchas peticiones simultáneas desde la app contra el API falso, con
 * latencia alta y con una parte de las respuestas en 5xx.
 */
import { AppError } from '../../core/errors/AppError';
import { FAULTS, LIMITS, LOAD } from '../../core/testing/stress/config';
import { record, recordRecovery, trackHeap, writeStressPart } from '../../core/testing/stress/metrics';
import { signedInWaiter } from '../../core/testing/stress/setup';

type Deps = Awaited<ReturnType<typeof signedInWaiter>>['deps'];

/** Mezcla de lecturas que hace la app al abrir sus pantallas. */
const requestsOf = (deps: Deps): (() => Promise<unknown>)[] => [
  () => deps.listTablesUseCase.execute(),
  () => deps.listActiveReservationsUseCase.execute(),
  () => deps.getDishUseCase.execute(10_000),
];

/** Lanza `size` peticiones a la vez; devuelve la duración de cada una y cuáles fallaron. */
async function burst(deps: Deps, size: number) {
  const kinds = requestsOf(deps);
  const durations: number[] = [];
  const settled = await Promise.allSettled(
    Array.from({ length: size }, async (_, i) => {
      const t0 = performance.now();
      try {
        return await kinds[i % kinds.length]();
      } finally {
        durations.push(performance.now() - t0);
      }
    }),
  );
  return { durations, rejected: settled.filter((s) => s.status === 'rejected') as PromiseRejectedResult[] };
}

describe('Esfuerzo: ráfagas de peticiones simultáneas', () => {
  afterAll(() => writeStressPart(__filename));

  it(`${LOAD.bursts} ráfagas de ${LOAD.burstSize} peticiones simultáneas responden con p95 ≤ ${LIMITS.p95Ms.burstRequest} ms`, async () => {
    // Arrange
    const { deps } = await signedInWaiter();
    const durations: number[] = [];
    await burst(deps, LOAD.burstSize); // calentamiento, no se mide
    const heap = trackHeap('Ráfagas de peticiones simultáneas', LOAD.bursts, LIMITS.heapGrowthMb);
    const started = performance.now();

    // Act
    for (let i = 0; i < LOAD.bursts; i++) {
      const result = await burst(deps, LOAD.burstSize);
      durations.push(...result.durations);
      expect(result.rejected).toHaveLength(0);
    }
    const metric = record('Ráfagas de peticiones simultáneas', {
      carga: `${LOAD.bursts} × ${LOAD.burstSize} peticiones`,
      limitP95Ms: LIMITS.p95Ms.burstRequest,
      durations,
      totalMs: performance.now() - started,
    });

    // Assert
    expect(metric.p95Ms).toBeLessThanOrEqual(LIMITS.p95Ms.burstRequest);
    expect(heap().aprobado).toBe(true);
  });

  it(`con latencia de ${FAULTS.highLatencyMs} ms una ráfaga termina con p95 ≤ ${LIMITS.p95Ms.slowApiRequest} ms`, async () => {
    // Arrange
    const { api, deps } = await signedInWaiter();
    api.faults.latencyMs = FAULTS.highLatencyMs;
    const started = performance.now();

    // Act
    const result = await burst(deps, LOAD.burstSize);
    const metric = record(`Ráfaga con API lento (+${FAULTS.highLatencyMs} ms)`, {
      carga: `${LOAD.burstSize} peticiones`,
      limitP95Ms: LIMITS.p95Ms.slowApiRequest,
      durations: result.durations,
      totalMs: performance.now() - started,
    });

    // Assert
    expect(result.rejected).toHaveLength(0);
    expect(metric.p95Ms).toBeLessThanOrEqual(LIMITS.p95Ms.slowApiRequest);
  });

  it(`si ${FAULTS.burstErrorRate * 100} % de una ráfaga responde 503, esas fallan con un error controlado y la siguiente ráfaga se recupera`, async () => {
    // Arrange
    const { api, deps } = await signedInWaiter();
    const failing = LOAD.burstSize * FAULTS.burstErrorRate;
    api.faults.failNext(failing, 503);

    // Act
    const first = await burst(deps, LOAD.burstSize);
    const second = await burst(deps, LOAD.burstSize);

    // Assert
    expect(first.rejected).toHaveLength(failing);
    expect(first.rejected.every((r) => r.reason instanceof AppError && r.reason.kind === 'server')).toBe(
      true,
    );
    expect(second.rejected).toHaveLength(0);
    recordRecovery({
      escenario: 'Ráfaga con respuestas 503',
      falla: `${failing} de ${LOAD.burstSize} peticiones con 503`,
      intentos: second.rejected.length === 0 ? 2 : LIMITS.recoveryAttempts + 1,
      limiteIntentos: LIMITS.recoveryAttempts,
      datosIntactos: true,
    });
  });
});
