# Estrategia de pruebas

Enfoque estándar de pruebas para todas las historias (HU-01 a HU-09) de la app móvil. Cualquier código
nuevo sigue estas reglas, y el PR lo confirma con la plantilla de `.github/pull_request_template.md`.

## Niveles de prueba

| Nivel | Qué prueba | Herramienta | Dónde vive | Cuándo corre |
|---|---|---|---|---|
| Estática | Tipos, formato, reglas de ESLint (incluye seguridad), complejidad ≤ 15, duplicación ≤ 3% | `tsc`, Prettier, ESLint, jscpd | Todo `src/` | Cada PR, etapa 1 |
| Seguridad (SCA, secretos, SAST) | Dependencias vulnerables, secretos en el historial, patrones inseguros | `npm audit` (audit-ci), Gitleaks, CodeQL | Todo el repo | Cada PR, etapa 1 + CodeQL |
| Unitaria | Una pieza aislada: entidad, caso de uso, mapper, repositorio, ViewModel, componente | Jest + React Native Testing Library | `__tests__/` junto al código | Cada PR, etapa 2 |
| Integración | Varias capas juntas con el grafo real de dependencias y datos de prueba | Jest + RNTL + API falso | `src/__tests__/integration/` | Cada PR, etapa 3 |
| Build | Que el bundle de Android compila | `expo export` | — | Cada PR, etapa 4 |
| Regresión | Toda la suite (unitarias + integración) sobre el estado actual | `npm test` | — | Cada PR y antes de cada tag `sprint-*` |
| Aceptación | El criterio de aceptación de la HU, en un Android real | APK de `cd-preview` | Issue "PRUEBAS DE ACEPTACIÓN" | Fin de sprint, con el dueño |
| Seguridad dinámica | El APK y el API en ejecución | MobSF, OWASP ZAP | Issues de seguridad | Antes del release |

La mayoría de las pruebas son unitarias (rápidas y precisas), hay menos de integración y pocas manuales.

## Cómo se escribe una prueba

**Nombre del archivo**
- Unitaria: `<Pieza>.test.ts(x)` en la carpeta `__tests__/` de la capa (`domain/__tests__/LoginUseCase.test.ts`).
- Integración: `<flujo>.integration.test.tsx` en `src/__tests__/integration/`. El sufijo `.integration.test.`
  es lo que separa las dos etapas del pipeline (`npm run test:unit` / `npm run test:integration`).

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
| App de prueba | `src/core/testing/startTestApp.tsx` | Arranca la app completa contra el API falso y hace login con un usuario de prueba |

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

## Checklist para una historia nueva

1. Escribir primero la prueba del caso de uso (TDD) y luego el código.
2. Prueba del mapper con un DTO con la forma real del API.
3. Prueba del ViewModel o la pantalla con `makeTestDependencies()`.
4. Una prueba de integración del flujo principal en `src/__tests__/integration/` con `startTestApp()`.
   Si el flujo usa un endpoint nuevo, se agrega al API falso y sus datos a `testData.ts`.
5. `npm run lint`, `npm run typecheck`, `npm run test:unit -- --coverage`, `npm run test:integration` en local.
6. PR con la plantilla llena. El quality gate debe quedar en verde.

## Comandos

| Comando | Qué corre |
|---|---|
| `npm test` | Toda la suite (regresión) |
| `npm run test:unit -- --coverage` | Unitarias con cobertura y umbrales |
| `npm run test:integration` | Integración con datos de prueba |
| `npm run lint` / `npm run typecheck` / `npm run format:check` / `npm run duplication` | Análisis estático |
| `npm run audit` | Vulnerabilidades en dependencias |
