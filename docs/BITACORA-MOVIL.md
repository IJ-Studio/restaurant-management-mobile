# Bitácora de la app móvil

Registro resumido de decisiones y tareas hacia la entrega del 26 de noviembre de 2026. Cada entrada lleva un
ID (`B-nnn`) y etiquetas para buscarla sin leer todo el archivo:

```bash
grep -n '\[rubrica\]' docs/BITACORA-MOVIL.md
```

Etiquetas: `[plan]` `[rubrica]` `[gh-project]` `[decision]` `[api]` `[movil]` `[web]` `[bd]` `[entorno]`
`[equipo]` `[pruebas]` `[rendimiento]` `[seguridad]`.

---

## B-001 · 2026-11-12 · Plan de trabajo [plan]

Prioridad: móvil, después el API (sin él la móvil no funciona) y al final la web. Orden de las fases:

| Fase | Contenido | Fecha objetivo |
|---|---|---|
| 1 | Rúbrica de evaluación y elementos de GitHub Projects | 18-nov |
| 2 | Paridad funcional web → móvil | 20-nov |
| 3 | Validaciones con lógica de negocio, centralizadas en el API | 21-nov |
| 4 | Funciones pendientes (facturas en cola, importar carta, promociones y paquetes, imágenes de la landing…) | 23-nov |
| 5 | Base de datos: datos de prueba separados, restricciones e índices medidos | 24-nov |
| 6 | Estilos de la móvil iguales a los de la web desde un tema de tokens | 24-nov |
| 7 | Resto de pendientes | 25-nov |
| 8 | Rendimiento (medir, corregir, volver a medir) | 25-nov |
| 9 | Seguridad (solo lo que piden la rúbrica y el tablero) | 26-nov |

Las pruebas en un Android real se hacen en tandas al cerrar cada bloque (18, 21, 24 y 25 de noviembre), con
Maestro, y en ambos sentidos: lo que se hace en la web debe verse en la móvil y al revés.

## B-002 · 2026-11-12 · Estado frente a la rúbrica de noviembre [rubrica]

Revisión contra `develop` (`d3b140d`). Ningún criterio de noviembre está completo todavía.

| Criterio | Puntos | Estado | Qué falta |
|---|---|---|---|
| Pruebas de caja negra y Debug/Release | 2.0 | Parcial | Flujos de Maestro, matriz funcional y registro de errores corregidos |
| Conexión cloud y JWT | 1.5 | Cumplido | Refresco del token ante un 401 |
| Anti-MitM y cifrado | 1.5 | Parcial | Certificate pinning (el almacenamiento cifrado ya existe) |
| Derechos ARCO | 1.5 | Parcial | Aviso con casilla sin premarcar, eliminar cuenta desde la app y switches de exclusión |
| R8/ProGuard y anti-descompilación | 1.5 | Parcial | Configuración versionada y reporte de descompilación |
| Publicación en Google Play | 1.0 | Parcial | Captura de Play Console y versión con estos cambios |
| APK/AAB firmado | 0.5 | Parcial | Build de la versión final |
| Permisos justificados en runtime | 0.5 | Parcial | Diálogo previo al permiso y retirar permisos que no se usan |

Lo de octubre se mantiene. Se refuerza con Semgrep y mobsfscan en el pipeline (la rúbrica los nombra) y con la
tabla de patrones de diseño en `docs/architecture.md`.

## B-003 · 2026-11-12 · Estado del tablero de GitHub Projects [gh-project]

28 elementos asignados a Irving sin cerrar. Verificados contra el código:

- **Ya cumplen su criterio de aceptación** (se cierran tras la primera tanda en el teléfono): #323 navegación
  por rol, #331 registrar reservación, #348 panel del administrador y api#68 `GET /menu`.
- **Con trabajo pendiente:** tiempo real de pedidos (#342, #376), notificaciones al cambiar el estado
  (api#75, #380), cobro con Stripe (#338, #339, #341), pruebas de rendimiento y esfuerzo con k6 (api#80,
  api#82, api#84, api#85), aceptación con Maestro (#367, #373, #379, #385) y pruebas del panel (#382).
- **Sprint 5** (30-nov a 11-dic): #352, #353, #356, #357, #358, #387, #388, api#86 y api#87.

Los issues nombran `unit-tests.yml` y `acceptance-tests.yml`; en el repositorio son jobs de `ci.yml`.

## B-004 · 2026-11-12 · Decisiones de arranque [decision]

| ID | Decisión | Motivo |
|---|---|---|
| DM-05 | Las pruebas en el teléfono usan un build local con otro identificador de paquete | Convive con la versión instalada desde Google Play sin tocarla |
| DM-06 | El pinning fija claves públicas de autoridades certificadoras, con claves de respaldo, y solo para el host de producción | El certificado del servidor rota cada pocas semanas; fijarlo dejaría la app sin red |
| DM-07 | El API expone `GET/PUT /profile` y `DELETE /account`; eliminar la cuenta desactiva y anonimiza, y conserva nómina y registros fiscales | Son las rutas que pide la rúbrica; la ley obliga a conservar esos registros |
| DM-08 | El refresco de token es compatible hacia atrás: si el API no lo entrega, la app cierra la sesión como hoy | La app publicada debe seguir funcionando con el API desplegado |
| DM-09 | El tiempo real de pedidos va por SSE, no por WebSocket | No añade módulos nativos y el API ya tiene un flujo SSE para el administrador |
| DM-11 | Los PRs de la móvil van en pila: cada rama sale de la anterior mientras espera revisión | `develop` exige la aprobación de otro desarrollador |
| DM-12 | Las evidencias de la rúbrica se versionan en `docs/`; los hallazgos de seguridad no | No publicar detalles explotables |
| DM-13 | Los tags `sprint-*` y `v*` no se crean en estas tareas | Disparan los builds de EAS; los lanza quien publica |

## B-005 · 2026-11-12 · Entorno de pruebas local [entorno] [bd]

- Base de datos de pruebas local, aislada de producción, con la estructura generada desde el esquema de
  Drizzle del API (62 tablas, 5 vistas) y datos sintéticos: un usuario por rol y una carta mínima.
- El API local corre en el puerto 10000; para el teléfono se publica por un túnel HTTPS, porque la app rechaza
  HTTP fuera de desarrollo.
- Herramientas: Maestro 2.12, k6 2.4 (carga), jadx 1.5.6 (descompilación) y el SDK de Android para builds
  locales de depuración y de release.

## B-006 · 2026-11-12 · Dependencias con José [equipo] [gh-project]

| Elemento | De quién | Qué se deja preparado para no bloquear |
|---|---|---|
| #343 lista de pedidos en tiempo real | José | Canal SSE en el API, observer y hook con pruebas; la lista solo tiene que usarlos |
| api#73 seguridad del canal en tiempo real | José | El canal y su contrato (autenticación y filtro por rol) |
| #345 y #346 notificaciones push | José | Disparo en el API al cambiar el estado y contrato del contenido (`orderId`, `type`) |
| #338, #339 y #341 Stripe (trabajo en pareja) | Ambos | Puerto, adapter, caso de uso y pruebas con mock en una rama; la revisión de José hace de sesión en pareja |
| #326, #335, #344 y #351 tags de sprint y builds | José | Flujos de Maestro listos para correr sobre cada APK |
| #354 auditoría del APK con MobSF | José | Reporte de descompilación con jadx y reglas de ofuscación |
| Play Console, llave de FCM y cuenta de servicio | José | Lista de lo que falta en `docs/deployment-google-play.md` |

No se puede adelantar: la aprobación del dueño en las pruebas de aceptación y la publicación en Play Console.

## B-007 · 2026-11-13 · Ofuscación R8, reducción de recursos y permisos mínimos [rubrica] [movil] [seguridad]

- `app.json` configura `expo-build-properties`: `minifyEnabled` y `shrinkResources` en release, más dos
  reglas de ProGuard (conservar números de línea y ocultar el nombre de los archivos fuente). Sin reglas
  `-keep` propias: las de React Native, Expo y Sentry vienen en cada librería.
- Build local de release descompilado con jadx: 83 % de las clases renombradas, 11 311 eliminadas, la
  lógica de la app en bytecode de Hermes y ningún secreto en el bundle. Detalle en
  [`reporte-ofuscacion-jadx.md`](reporte-ofuscacion-jadx.md).
- Permisos: se retiran almacenamiento, `SYSTEM_ALERT_WINDOW` y biometría, que la app no usa, y se
  desactiva `allowBackup`. Tabla con el motivo de cada permiso en [`permisos.md`](permisos.md).
- `app.config.js` permite un identificador de paquete distinto en builds locales de prueba
  (`APP_ANDROID_PACKAGE`); los builds de EAS no cambian.
- Decisión: `android/` sigue sin versionarse. La evidencia de `build.gradle` es la configuración de
  `app.json`, que es la que genera ese archivo en cada build.
- Pendiente para la tanda en el teléfono: recorrer la app en el build de release (inicio de sesión,
  navegación por rol, selector de fecha, avisos) para confirmar que la reducción no rompe nada.
