# Estrategia de pruebas

Enfoque estándar de pruebas para todas las historias (HU-01 a HU-09) de la app móvil. Cualquier código
nuevo sigue estas reglas, y el PR lo confirma con la plantilla de `.github/pull_request_template.md`.

## Niveles de prueba

| Nivel | Qué prueba | Herramienta | Dónde vive | Cuándo corre |
|---|---|---|---|---|
| Estática | Tipos, formato, reglas de ESLint (incluye seguridad), complejidad ≤ 15, duplicación ≤ 3% | `tsc`, Prettier, ESLint, jscpd | Todo el repo | Cada PR, etapa 1 |
| Seguridad (SCA, secretos, SAST) | Dependencias vulnerables, secretos en el historial, patrones inseguros | `npm audit` (audit-ci), Gitleaks, CodeQL | Todo el repo | Cada PR, etapa 1 + CodeQL |
| Unitaria | Una pieza aislada: entidad, caso de uso, mapper, repositorio, ViewModel, componente | Jest + React Native Testing Library | `__tests__/` junto al código | Cada PR, etapa 2 |
| Integración | Varias capas juntas con el grafo real de dependencias y datos de prueba | Jest + RNTL + API falso | `src/__tests__/integration/` | Cada PR, etapa 3 |
| Aceptación automatizada | Cada criterio de aceptación de HU-01..HU-05, recorriendo la app completa como el usuario de cada rol | Jest + RNTL + API falso | `src/__tests__/acceptance/*.acceptance.test.tsx` | Cada PR, etapa 4 |
| Rendimiento | Tiempo y número de renders de Login, Menú, Pedido de mesa y Reservaciones contra `develop`; tamaño del bundle | Reassure + `expo export` | `src/__perf__/*.perf-test.tsx` | Cada PR, etapa 5 |
| Esfuerzo | Volumen alto, ráfagas, latencia, 5xx y timeouts en un entorno aislado; recuperación | Jest + API falso con fallas inyectadas | `src/__tests__/stress/*.stress.test.ts(x)` | Nocturno, manual y PRs a `main`/`release/**` |
| Regresión | Toda la suite (unitarias + integración) sobre el estado actual | `npm test` | — | Cada PR y antes de cada tag `sprint-*` |
| Aceptación con el dueño | El criterio de aceptación de la HU, en un Android real | APK de `cd-preview` | Issue "PRUEBAS DE ACEPTACIÓN" | Fin de sprint, con el dueño |
| Seguridad dinámica | El APK y el API en ejecución | MobSF, OWASP ZAP | Issues de seguridad | Antes del release |

La mayoría de las pruebas son unitarias (rápidas y precisas), hay menos de integración y pocas manuales.

## Cómo se escribe una prueba

**Nombre del archivo**
- Unitaria: `<Pieza>.test.ts(x)` en la carpeta `__tests__/` de la capa (`domain/__tests__/LoginUseCase.test.ts`).
- Integración: `<flujo>.integration.test.tsx` en `src/__tests__/integration/`. El sufijo `.integration.test.`
  es lo que separa las dos etapas del pipeline (`npm run test:unit` / `npm run test:integration`).
- Aceptación: `huNN-<historia>.acceptance.test.tsx` en `src/__tests__/acceptance/`.
- Rendimiento: `<Pantalla>.perf-test.tsx` en `src/__perf__/`.
- Esfuerzo: `<área>.stress.test.ts(x)` en `src/__tests__/stress/`.
- `npm test` no corre aceptación ni esfuerzo (`testPathIgnorePatterns` en `jest.config.js`) y Jest no
  reconoce `*.perf-test.tsx`: cada nivel tiene su script y su etapa.

**Nombres en español, como comportamiento.** `describe` es la pieza o el flujo; `it` dice qué pasa:

```ts
describe('LoginUseCase', () => {
  it('rechaza un correo con formato inválido sin llamar al API', async () => { ... });
});
```

**Estructura Preparar · Actuar · Verificar (AAA)**, separada con una línea en blanco:

```ts
it('suma una unidad si el platillo se repite', () => {
  const order = addDish(emptyOrder(), enchiladas);       // Preparar

  const result = addDish(order, enchiladas);             // Actuar

  expect(result.lines[0].quantity).toBe(2);              // Verificar
});
```

**Una conducta por prueba.** Varios `expect` están bien si verifican la misma conducta.

**Qué se simula en cada capa**

| Capa que se prueba | Qué es falso | Qué es real |
|---|---|---|
| Entidad / función pura | Nada | Todo |
| Caso de uso | El repositorio (`jest.Mocked<Repository>`) | El caso de uso |
| Datasource / repositorio | `HttpClient` o `fetchFn` | Mapper y repositorio |
| ViewModel / pantalla | Los casos de uso, con `makeTestDependencies()` | React Query, Zustand, la pantalla |
| Integración | Solo la red (API falso) y el almacenamiento seguro (memoria) | Todo el grafo de `createDependencies()` |

Nunca se simula el dominio y nunca se llama a un servidor real desde Jest.

**Tiempo y fechas.** Los casos de uso reciben el reloj por constructor (`now: () => Date`). Las pruebas
pasan una fecha fija o calculan fechas relativas a hoy; nunca dependen de la hora en que corren.

## Datos de prueba

| Tipo | Dónde | Para qué |
|---|---|---|
| Fábricas por feature | `src/features/<feature>/__fixtures__/` | `makeDish()`, `makeSession()`, ... con `overrides` para cada caso unitario |
| Conjunto de datos compartido | `src/core/testing/data/testData.ts` | Usuarios por rol, menú (con categoría inactiva y platillo agotado), mesas (con una inactiva) y reservaciones (con una cancelada) |
| API falso | `src/core/testing/fakeApi.ts` | Responde con la forma real de restaurant-management-api a partir de `testData.ts` y guarda cada petición |
| App de prueba | `src/core/testing/startTestApp.tsx` | Arranca la app completa contra el API falso y hace login con un usuario de prueba. Acepta un `api` y un `storage` ya usados para simular cerrar y abrir la app |
| Datos de volumen | `src/core/testing/data/loadData.ts` | `makeMenu(n)`, `makeReservations(n)`, `makeOrderLines(n)`, `makeTables(n)` deterministas, para rendimiento y esfuerzo |
| Fallas inyectadas | `createFakeApi().faults` | `latencyMs`, `failNext(n, status, ruta?)` y `hangNext(n, ruta?)` (petición que no responde → timeout) |

Reglas:
- Los datos tienen **la misma forma que el API real** (`docs/api-endpoints.md`), incluidas columnas que la app
  debe descartar (`precioCosto`, `password`), para probar que los mappers las quitan.
- Son **ficticios**: correos `@pruebas.quijote.mx` y contraseña `Prueba#2026` que solo existe en las pruebas.
  Nunca se copian datos reales de clientes ni del personal.
- Un caso especial nuevo (otro estado, otro error) se agrega al conjunto de datos y no se inventa dentro de la prueba.

Usuarios de prueba:

| Rol | Correo | Contraseña |
|---|---|---|
| Admin | `admin@pruebas.quijote.mx` | `Prueba#2026` |
| Cajero | `cajero@pruebas.quijote.mx` | `Prueba#2026` |
| Mesero | `mesero@pruebas.quijote.mx` | `Prueba#2026` |
| Cocina | `cocina@pruebas.quijote.mx` | `Prueba#2026` |

## Pruebas de aceptación (etapa 4)

- Una suite por historia en `src/__tests__/acceptance/`. Cada prueba usa `startTestApp()` (grafo real +
  API falso) y recorre la app como el usuario: inicia sesión con el usuario de prueba de su rol, toca
  pestañas y botones, y revisa lo que ve en pantalla. Ayudas en `src/core/testing/acceptance.tsx`.
- **Cada prueba empieza con el ID de su criterio**: `HU-01 CA-1: el mesero inicia sesión y ve el menú…`.
- Los criterios están en `scripts/testing/acceptance-criteria.json`, copiados del texto de cada issue
  (#318, #323, #327, #331, #336).
- El reporter `scripts/testing/acceptance-reporter.js` genera la matriz HU | criterio | prueba | resultado
  (`reports/acceptance/traceability.md` y `.json`) y **reprueba** si una prueba no tiene ID o si un criterio
  no tiene ninguna prueba. `jest-junit` genera `reports/acceptance/junit.xml`.
- HU-05 CA-1 y CA-2 (cobro con Stripe) están como `it.todo`: salen como **Pendiente** en el reporte hasta
  que esa parte llegue a `develop` (#338–#341).

## Pruebas de rendimiento (etapa 5)

- Reassure mide tiempo y número de renders de 4 escenarios: Login (captura de credenciales), Menú (120
  platillos + búsqueda), Pedido de mesa (30 platillos, elegir mesa, cambiar cantidad) y Reservaciones
  (60 activas). Cada escenario se repite 30 veces más 3 de calentamiento (`src/core/testing/perf.tsx`).
- En CI se mide la rama destino (`develop`) como **línea base** con las mismas pruebas y datos
  (`scripts/perf/prepare-baseline.sh`) y luego la rama, en **2 rondas ABBA** (base, rama | rama, base)
  que se unen con `scripts/perf/merge-perf.js`. Así el ruido del runner y el sesgo de la segunda corrida
  se cancelan: con el mismo código, el percentil 10 varía menos de ±5 %.
- `scripts/perf/check-performance.js` genera `.reassure/output.json` y `output.md` y aplica los umbrales.
- El bundle de Android se exporta (`expo export --platform android`) en la base y en la rama, y
  `scripts/perf/bundle-size.js` mide el JavaScript (Hermes) y el export completo.

| Métrica | Umbral (reprueba si…) |
|---|---|
| Tiempo de render | el percentil 10 empeora **más de 10 %** y por al menos 1 ms |
| Número de renders | **aumenta** (promedio redondeado de la rama > el de la base) |
| Bundle JS de Android | crece **más de 5 %** contra `develop` |
| Escenario nuevo sin línea base | no reprueba; sale como "Sin línea base" |

## Pruebas de esfuerzo (`stress-tests.yml`)

Entorno aislado: todo corre en Jest contra el API falso en memoria, sin red ni staging. Las pruebas de carga
del servidor (k6) pertenecen a `restaurant-management-api`. Parámetros en `src/core/testing/stress/config.ts`:

| Carga | Valor |
|---|---|
| Menú | 2 000 platillos en 40 categorías |
| Pedido de una mesa | 200 líneas distintas |
| Reservaciones activas | 500 |
| Ráfagas | 10 ráfagas de 100 peticiones simultáneas |
| Ciclos | 30 por operación de datos, 8 por render, 20 búsquedas (+1 de calentamiento cada una) |

| Límite | Valor |
|---|---|
| p95 cargar menú / listar reservaciones / enviar pedido / armar pedido | 200 / 50 / 50 / 50 ms |
| p95 abrir app hasta ver el menú / buscar / render pedido / render reservaciones | 800 / 150 / 300 / 300 ms |
| p95 por petición en ráfaga / con API lento (+300 ms) | 500 / 900 ms |
| Crecimiento del heap (GC forzado) entre el primer y el último ciclo | ≤ 64 MB |
| Intentos del usuario para recuperarse | ≤ 3 |

| Falla inyectada | Qué se verifica |
|---|---|
| Latencia de 300 ms en cada respuesta | La ráfaga termina sin errores y dentro del p95 |
| 10 de 100 peticiones de una ráfaga con 503 | Fallan con `AppError` `server` (no cuelgan la app) y la siguiente ráfaga sale limpia |
| 2 respuestas 503 seguidas al enviar un pedido de 200 líneas | El pedido no se pierde y se envía en ≤ 3 intentos |
| Una petición sin respuesta (timeout de 250 ms) | El pedido no se pierde y se envía al reintentar |
| El menú responde 500 | "Reintentar" lo recupera cuando el API vuelve |

El reporter `scripts/testing/stress-reporter.js` genera `reports/stress/stress-report.json` y `.md` con carga,
duración, métricas, límites y resultado, y reprueba si se rebasa un límite.

## Criterios de aprobación (los aplica el pipeline)

| Criterio | Umbral | Si no se cumple |
|---|---|---|
| Pruebas unitarias y de integración | 100% en verde | El job falla y el quality gate reprueba |
| Cobertura global | ≥ 70% en líneas, ramas, funciones y sentencias | `unit-tests` falla |
| Cobertura por archivo en casos de uso, `data/` y ViewModels | ≥ 80% de líneas | `unit-tests` falla |
| ESLint | 0 errores y 0 warnings | `static-analysis` falla y las pruebas no corren |
| Complejidad cognitiva | ≤ 15 por función | `static-analysis` falla |
| Duplicación | ≤ 3% | `static-analysis` falla |
| Vulnerabilidades | 0 High/Critical sin justificar | `security` falla |
| Secretos | 0 hallazgos de Gitleaks | `security` falla |
| Criterios de aceptación | Todos en verde, con ID y con al menos una prueba | `acceptance-tests` falla |
| Rendimiento contra `develop` | p10 de render ≤ +10 %, sin renders extra, bundle ≤ +5 % | `performance-tests` falla |
| Esfuerzo | p95, memoria y recuperación dentro de los límites | `stress-tests` falla |

## Checklist para una historia nueva

1. Escribir primero la prueba del caso de uso (TDD) y luego el código.
2. Prueba del mapper con un DTO con la forma real del API.
3. Prueba del ViewModel o la pantalla con `makeTestDependencies()`.
4. Una prueba de integración del flujo principal en `src/__tests__/integration/` con `startTestApp()`.
   Si el flujo usa un endpoint nuevo, se agrega al API falso y sus datos a `testData.ts`.
5. Si la historia tiene criterios de aceptación nuevos, agregarlos a `scripts/testing/acceptance-criteria.json`
   y escribir su prueba en `src/__tests__/acceptance/` con el ID `HU-NN CA-N:` al inicio del nombre.
6. Si agrega una pantalla clave, su prueba de rendimiento en `src/__perf__/`.
7. `npm run lint`, `npm run typecheck`, `npm run test:unit -- --coverage`, `npm run test:integration` y
   `npm run test:acceptance` en local.
8. PR con la plantilla llena. El quality gate debe quedar en verde.

## Comandos

| Comando | Qué corre |
|---|---|
| `npm test` | Toda la suite (regresión) |
| `npm run test:unit -- --coverage` | Unitarias con cobertura y umbrales |
| `npm run test:integration` | Integración con datos de prueba |
| `npm run test:acceptance` | Aceptación; deja `reports/acceptance/junit.xml` y `traceability.md` |
| `npm run test:perf` | Reassure sobre `src/__perf__` (`npx reassure --baseline` para guardar una línea base local) |
| `npm run test:stress` | Esfuerzo con GC expuesto; deja `reports/stress/stress-report.{json,md}` |
| `scripts/perf/measure-rounds.sh <base> <rama> 2 perf` + `node scripts/perf/check-performance.js …` | La comparación de rendimiento que hace CI |
| `npm run lint` / `npm run typecheck` / `npm run format:check` / `npm run duplication` | Análisis estático |
| `npm run audit` | Vulnerabilidades en dependencias |
