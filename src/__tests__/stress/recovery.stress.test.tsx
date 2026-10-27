/**
 * Fallas inyectadas en la app completa: el API responde 5xx o deja de responder (timeout) mientras
 * el mesero manda un pedido grande o abre el menú. Cuando el API vuelve, la app debe recuperarse en
 * pocos intentos del usuario y sin perder el pedido armado.
 */
import { fireEvent, screen } from '@testing-library/react-native';

import { signInAs } from '../../core/testing/acceptance';
import { startTestApp } from '../../core/testing/startTestApp';
import { FAULTS, LIMITS, LOAD } from '../../core/testing/stress/config';
import { recordRecovery, writeStressPart } from '../../core/testing/stress/metrics';
import { bigOrder, createLoadedApi } from '../../core/testing/stress/setup';

/** Arranca como mesero con un pedido de LOAD.orderLines líneas listo en la pantalla del pedido. */
async function waiterWithBigOrder(api: ReturnType<typeof createLoadedApi>) {
  const app = await startTestApp({ api });
  await signInAs('mesero');
  app.deps.currentOrderStore.setState({ order: bigOrder() });
  const items = bigOrder().lines.reduce((sum, l) => sum + l.quantity, 0);
  await fireEvent.press(await screen.findByRole('button', { name: `Pedido de la mesa, ${items} platillos` }));
  await screen.findByRole('button', { name: 'Enviar a cocina' });
  return app;
}

/** Toca "Enviar a cocina" hasta que el API lo acepte; cuenta los intentos y revisa el pedido tras cada falla. */
async function sendUntilAccepted(app: Awaited<ReturnType<typeof startTestApp>>) {
  let orderKept = true;
  for (let attempt = 1; attempt <= LIMITS.recoveryAttempts + 1; attempt++) {
    await fireEvent.press(screen.getByRole('button', { name: 'Enviar a cocina' }));
    const outcome = await Promise.race([
      screen.findByText(/Pedido enviado a cocina/, {}, { timeout: 3_000 }).then(() => 'ok' as const),
      screen.findByRole('alert', {}, { timeout: 3_000 }).then(() => 'error' as const),
    ]);
    if (outcome === 'ok') return { attempts: attempt, orderKept };
    orderKept &&= app.deps.currentOrderStore.getState().order.lines.length === LOAD.orderLines;
  }
  return { attempts: LIMITS.recoveryAttempts + 1, orderKept };
}

describe('Esfuerzo: fallas inyectadas y recuperación', () => {
  afterAll(() => writeStressPart(__filename));

  it(`con ${FAULTS.consecutive5xx} respuestas 503 seguidas el pedido de ${LOAD.orderLines} líneas no se pierde y se envía en ≤ ${LIMITS.recoveryAttempts} intentos`, async () => {
    // Arrange
    const api = createLoadedApi();
    const app = await waiterWithBigOrder(api);
    api.faults.failNext(FAULTS.consecutive5xx, 503, /^pedidos\//);

    // Act
    const { attempts, orderKept } = await sendUntilAccepted(app);

    // Assert
    const result = recordRecovery({
      escenario: 'Enviar pedido con el API caído (5xx)',
      falla: `${FAULTS.consecutive5xx} respuestas 503 seguidas`,
      intentos: attempts,
      limiteIntentos: LIMITS.recoveryAttempts,
      datosIntactos: orderKept,
    });
    expect(result.aprobado).toBe(true);
    expect(api.orders.size).toBe(1);
    expect([...api.orders.values()][0].items).toHaveLength(LOAD.orderLines);
  });

  it(`si el API no responde (timeout de ${FAULTS.clientTimeoutMs} ms) el pedido no se pierde y se envía al reintentar`, async () => {
    // Arrange
    const api = createLoadedApi({ timeoutMs: FAULTS.clientTimeoutMs });
    const app = await waiterWithBigOrder(api);
    api.faults.hangNext(1, /^pedidos\//);

    // Act
    const { attempts, orderKept } = await sendUntilAccepted(app);

    // Assert
    const result = recordRecovery({
      escenario: 'Enviar pedido con el API sin responder',
      falla: `1 petición sin respuesta (timeout ${FAULTS.clientTimeoutMs} ms)`,
      intentos: attempts,
      limiteIntentos: LIMITS.recoveryAttempts,
      datosIntactos: orderKept,
    });
    expect(result.aprobado).toBe(true);
    expect(screen.getByText(/Pedido enviado a cocina/)).toBeOnTheScreen();
  });

  it('si el menú falla al cargar, "Reintentar" lo recupera cuando el API vuelve', async () => {
    // Arrange
    const api = createLoadedApi();
    api.faults.failNext(1, 500, /^menu\//);
    await startTestApp({ api });

    // Act
    await signInAs('mesero');
    let attempts = 1;
    await fireEvent.press(await screen.findByRole('button', { name: 'Reintentar' }));
    attempts += 1;

    // Assert
    expect(await screen.findByText('Platillo 1')).toBeOnTheScreen();
    const result = recordRecovery({
      escenario: 'Cargar el menú con el API caído',
      falla: '1 respuesta 500 en el menú',
      intentos: attempts,
      limiteIntentos: LIMITS.recoveryAttempts,
      datosIntactos: true,
    });
    expect(result.aprobado).toBe(true);
  });
});
