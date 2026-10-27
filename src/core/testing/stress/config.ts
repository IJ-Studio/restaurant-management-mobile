/**
 * Parámetros de las pruebas de esfuerzo de la app (src/__tests__/stress). Todo corre contra el API
 * falso en memoria, sin red. Las pruebas de carga del servidor viven en restaurant-management-api.
 *
 * Estos valores salen tal cual en reports/stress/stress-report.{json,md}.
 */

/** Volumen de datos de cada escenario. */
export const LOAD = {
  /** Menú de un restaurante muy grande. */
  menuDishes: 2_000,
  menuCategories: 40,
  /** Pedido de una mesa con muchos platillos distintos. */
  orderLines: 200,
  /** Reservaciones activas de un día lleno. */
  reservations: 500,
  tables: 60,
  /** Peticiones simultáneas por ráfaga y número de ráfagas. */
  burstSize: 100,
  bursts: 10,
} as const;

/** Repeticiones de cada operación (el p95 se calcula sobre ellas). */
export const CYCLES = {
  dataLayer: 30,
  render: 8,
  search: 20,
  orderBuild: 30,
} as const;

/**
 * Límites. Se fijaron en ~4× el p95 medido en local (y redondeados) para tolerar el ruido de un
 * runner compartido de GitHub sin dejar pasar una degradación real, p. ej. un render que se vuelve
 * cuadrático con el volumen. Medido en local: menú 45 ms, ráfaga 111 ms, abrir app 184 ms.
 */
export const LIMITS = {
  p95Ms: {
    loadMenu: 200,
    listReservations: 50,
    sendOrder: 50,
    buildOrder: 50,
    renderMenu: 800,
    searchMenu: 150,
    renderOrder: 300,
    renderReservations: 300,
    burstRequest: 500,
    /** Debe cubrir la latencia inyectada (FAULTS.highLatencyMs) más el procesamiento. */
    slowApiRequest: 900,
  },
  /** Crecimiento máximo del heap (con GC forzado) entre el primer y el último ciclo de una operación. */
  heapGrowthMb: 64,
  /** Intentos máximos del usuario para que la app se recupere cuando el API vuelve a responder. */
  recoveryAttempts: 3,
} as const;

/** Fallas que se inyectan en el API falso. */
export const FAULTS = {
  /** Latencia agregada a cada respuesta en el escenario de API lento. */
  highLatencyMs: 300,
  /** Respuestas 503 seguidas antes de que el API se recupere. */
  consecutive5xx: 2,
  /** Proporción de peticiones con 503 dentro de una ráfaga. */
  burstErrorRate: 0.1,
  /** Tiempo límite del HttpClient en el escenario de timeouts (ms). */
  clientTimeoutMs: 250,
} as const;
