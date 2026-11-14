# Bitácora de la app móvil

Registro resumido de decisiones y tareas hacia la entrega del 26 de noviembre de 2026. Cada entrada lleva un
ID (`B-nnn`) y etiquetas para buscarla sin leer todo el archivo:

```bash
grep -n '\[rubrica\]' docs/BITACORA-MOVIL.md
```

Etiquetas: `[plan]` `[rubrica]` `[gh-project]` `[decision]` `[api]` `[movil]` `[web]` `[bd]` `[entorno]`
`[equipo]` `[pruebas]` `[rendimiento]` `[seguridad]` `[pagos]` `[facturacion]`.

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

## B-008 · 2026-11-13 · Certificate pinning [rubrica] [movil] [seguridad]

- `react-native-ssl-public-key-pinning` configura el `CertificatePinner` de OkHttp con cuatro pins SHA-256
  para el API de producción: la autoridad raíz de la cadena actual y tres de respaldo. Los pins se
  calcularon con `openssl` a partir de la cadena real del servidor y del almacén de certificados del sistema.
- Decisión: fijar autoridades raíz y no el certificado del servidor, que rota cada pocas semanas; con
  fecha de caducidad (2027-11-30) para que una versión vieja no se quede sin red.
- Decisión: si la activación falla, la app sigue funcionando y lo reporta. Un atacante en la red no puede
  provocar ese fallo (es configuración local), y bloquear la app dejaría al restaurante sin servicio.
- `httpClient` espera la activación antes de la primera petición y muestra un aviso propio cuando el
  pinning rechaza un certificado. La capa HTTP no depende de Sentry: `App.tsx` le conecta el reporte.
- Pruebas unitarias de la configuración (formato y respaldo de los pins), de la activación y del aviso.
- Pendiente para la tanda en el teléfono: comprobar que el build de release habla con el API de producción
  y que un pin erróneo corta la conexión.

## B-009 · 2026-11-13 · Sesión por dispositivo y refresco de token [rubrica] [api] [movil] [decision]

- **Hallazgo.** El API guardaba la sesión en memoria con una entrada por usuario. Dos efectos en el
  restaurante: quien entraba en la web sacaba su propia sesión de la app (y al revés), y todas las
  sesiones se perdían cuando el servidor se reiniciaba o se dormía por falta de uso.
- **Decisión (administración):** una persona puede estar a la vez en la web y en la app, y nadie debe
  volver a escribir su contraseña a mitad del servicio. La sesión pasa a ser por dispositivo.
- **API** (PR #138 del API): `POST /auth/refresh` con token de un solo uso (solo se guarda su hash,
  caduca a los 30 días, rotación atómica y revocación total si llega uno ya usado). El login devuelve
  además `refreshToken`. Tabla `refresh_tokens` con migración y reversa.
- **Móvil:** el token de refresco se guarda en el almacenamiento cifrado. Ante un 401, `httpClient`
  renueva una sola vez (las peticiones simultáneas comparten la renovación) y repite la petición. Sin
  red, la sesión se conserva. Si el API no entrega refresco, la app se comporta como antes.
- Pruebas: unitarias del cliente HTTP, del caso de uso, del mapper y del cierre de sesión, y dos de
  integración (el servidor se reinicia y el mesero sigue trabajando; el refresco ya no sirve y la app
  vuelve al Login con el aviso).
- Pendiente para la tanda en el teléfono: reiniciar el API con la app abierta y comprobar que sigue
  funcionando sin pedir la contraseña; entrar con el mismo usuario en la web y en la app.

## B-010 · 2026-11-13 · Aviso de privacidad y derechos ARCO [rubrica] [api] [movil] [decision]

- **API** (PR #137 del API): `GET/PUT /profile`, `GET/PUT /profile/privacidad` y `DELETE /account`, con la
  tabla `consentimientos` (solo inserción: el estado vigente es la última fila de cada tipo).
- **Móvil:** feature `privacy` nueva.
  - Aviso con consentimiento explícito tras iniciar sesión: casilla sin marcar, no se puede continuar
    sin marcarla y quien no acepta cierra la sesión. Una vez por persona y por versión del aviso.
  - Perfil → Privacidad: fecha en que se aceptó el aviso, switches de «Avisos de pedidos» y «Reportes de
    errores», dónde se ejerce cada derecho y «Eliminar mi cuenta».
  - Eliminar la cuenta pide la contraseña y una confirmación; al terminar vuelve al Login con el aviso.
  - El perfil se lee y se edita por `GET/PUT /profile`.
- **Decisión (administración):** si el API no responde al consultar el aviso, la app deja entrar y lo pide
  después. Un problema de red no debe dejar a un mesero sin poder tomar pedidos.
- **Decisión:** eliminar la cuenta borra los datos personales y conserva pedidos, cobros y nómina sin
  nombre, que la ley obliga a guardar. El único administrador activo no puede eliminarse.
- **Decisión:** el texto del aviso describe solo lo que la app hace (acceso por rol, registro de
  movimientos, avisos por Expo, informes de errores por Sentry) y enlaza al aviso completo de la web.
- En Perfil, los dos enlaces externos («Aviso de privacidad» y «Eliminar cuenta») pasan a una sola
  entrada «Privacidad». La eliminación ya no manda a la web: se hace dentro de la app.
- Mapa de derechos, pantallas y endpoints en [`privacidad-arco.md`](privacidad-arco.md).
- Pendiente para la tanda en el teléfono: primer inicio de sesión con el aviso, switches, eliminar una
  cuenta de prueba y comprobar en la web que esa cuenta ya no entra.

## B-011 · 2026-11-13 · Notificaciones: aviso al cambiar el estado, permiso explicado y registro del teléfono [rubrica] [gh-project] [api] [movil]

- **API** (PRs #139 y #140 del API; cierra api#75): al marcar un pedido como listo se avisa a los meseros
  y al entregarlo se avisa a caja. El aviso lleva solo la mesa y, en `data`, `{ type, orderId, place }`:
  nunca nombres de clientes ni importes. Sale sin esperar la respuesta y no deshace el cambio si falla.
- **Móvil:**
  - El permiso de notificaciones ya no aparece solo al entrar: primero un diálogo propio explica para
    qué es y la persona decide («Activar avisos» o «Ahora no»).
  - Con el permiso concedido, la app obtiene el token de Expo y registra el teléfono en el API; al cerrar
    sesión lo da de baja, antes de invalidar la sesión.
  - Tocar un aviso abre ese pedido, con la lista debajo para poder volver. Solo se aceptan tipos de aviso
    conocidos y un id con forma de identificador.
- **Decisión:** el aviso va por rol, como pide la tarea. Avisar solo al mesero que atiende la mesa queda
  como mejora.
- **Decisión:** si el teléfono no puede dar un token (sin servicios de Google o sin la llave de FCM en el
  build), la app sigue funcionando sin avisos.
- **Dependencia con José:** HU-07 (#345 y #346) estaba a su cargo; queda implementada y probada para que
  solo la revise. La entrega real en un build propio necesita la llave de FCM en EAS.
- Pruebas: unitarias del diálogo, del registro del teléfono, del destino del aviso y del adapter, y
  cuatro de integración (registro al entrar, explicación previa, baja al salir y abrir el pedido).
- Pendiente para la tanda en el teléfono: ver el diálogo en una instalación limpia, aceptar el permiso y
  comprobar el token en la base; un aviso real solo se puede probar con la llave de FCM.

## B-012 · 2026-11-13 · Pedidos en tiempo real por SSE [gh-project] [api] [movil] [decision]

- **API** (PR #141 del API): `GET /pedidos/stream` para el personal (401 sin sesión, 403 cliente).
  Emite `ready` al conectar, `order` en cada cambio (`items`, `sent`, `status`, `cancelled`, `charged`,
  solo con el id del pedido) y `ping` cada 25 s; se cierra a los 15 min para revalidar la sesión.
- **Móvil:** patrón Observer. Puerto `OrderEventsSource`, adapter `SseOrderEvents` (con `XMLHttpRequest`,
  porque el `fetch` de React Native no entrega la respuesta por partes y `EventSource` no deja mandar
  `Authorization`) y `useOrderEvents`, que con el estatus conocido actualiza la lista con
  `setQueryData` y luego invalida lo afectado. Reconexión con espera creciente (2, 5, 15 y 30 s); con
  401/403 no insiste y se vuelve a abrir al renovarse el token. El sondeo de 30 s queda de respaldo.
- **Decisión:** lector SSE propio de ~90 líneas en lugar de `react-native-sse` (sin mantenimiento desde
  2024 y reconexión fija de 5 s).
- **Límite:** el bus del API vive en memoria; con más de una instancia habrá que pasarlo a
  `LISTEN/NOTIFY` o Redis.
- Pruebas: evento, lector SSE (bloques partidos, eventos inválidos, reconexión, 401/403, cierre),
  observer y una integración (un cambio en otro teléfono hace que la lista se pida al momento).
- Pendiente para la tanda: dos teléfonos o web + teléfono; un cambio en uno aparece en el otro sin refrescar.

## B-013 · 2026-11-13 · SAST con Semgrep y mobsfscan; patrones documentados [rubrica] [seguridad]

- El job `security` de `ci.yml` suma Semgrep 1.182.1 (reglas de JavaScript, TypeScript, React y
  secretos) y mobsfscan 1.1.0 (reglas móviles de MobSF). Fallan con hallazgos de severidad ERROR y suben
  sus informes SARIF como artefacto `sast-report`. En local: 0 hallazgos en los dos.
- Se mantienen CodeQL, ESLint con `eslint-plugin-security`, `npm audit` y Gitleaks.
- `docs/architecture.md` tiene la tabla de patrones (Singleton, Factory, DI, Repository, Adapter,
  Observer, Facade y MVVM) con la ruta de cada uno.

## B-014 · 2026-11-13 · Caja negra con Maestro y registro de errores [rubrica] [pruebas] [gh-project]

- `.maestro/`: nueve flujos de aceptación (HU-01 a HU-08 y ARCO), subflujos de login y logout, y
  `scripts/api.js`, que hace de «otro teléfono» por el API para probar el tiempo real. `npm run test:device`
  los corre y deja `reports/maestro/junit.xml` y capturas.
- `docs/pruebas-caja-negra.md`: matriz CN-01 a CN-21 con columnas Debug y Release, y el registro de
  errores corregidos (E-01 a E-05, defectos reales de la versión 1.0.0 publicada).
- Decisión: la reservación válida (selector nativo de fecha), el reinicio del API y el pin erróneo se
  marcan como pruebas manuales en la matriz.
- Pendiente: ejecutar la matriz en la Tanda 1 (16-nov) y ajustar los textos de los flujos que no coincidan.

## B-015 · 2026-11-13 · Cobro con tarjeta (Stripe) y pruebas de rendimiento [rubrica] [gh-project] [api] [movil] [rendimiento]

- **Móvil:** puerto `PaymentGateway`, adapter `StripePaymentGateway` (PaymentSheet, solo llave pública),
  fachada `CheckoutUseCase` (intención en el API → pago → confirmación del servidor) y botón «Cobrar con
  tarjeta en la app» para la cuenta completa. HU-05 CA-1 y CA-2 pasan de pendientes a probadas.
  Detalle y pruebas de seguridad en [`pagos-stripe.md`](pagos-stripe.md).
- **API** (PR #143): el personal ya puede crear la intención con el pedido `lista` o `entregada`
  (antes solo `pendiente`, `para_cobrar` o `abierta`, que no es cuando se cobra una mesa) y se rechaza si
  ya hay pagos parciales, porque la intención cobra el total.
- **Rendimiento** (PR #142 del API): k6 con carga nominal (p95 29 ms en lecturas, 0,18 % de errores) y
  esfuerzo hasta 220 usuarios (p95 862 ms, 3,67 % de errores, sin caída).
- **Hallazgo y decisión (administración):** el API limita a 40 peticiones por minuto **por IP** y todo
  el personal comparte la IP del módem. Se hace configurable (`THROTTLE_LIMIT`) y se recomienda 300 en
  producción.

## B-016 · 2026-11-14 · Reglas de negocio centralizadas en el API (Fase 3) [api] [movil] [decision]

- **Error real corregido** (PR #144 del API): las reservas se validaban con la zona horaria del servidor.
  En Render (UTC) una reserva a las 20:00 de México se evaluaba como las 02:00 del día siguiente.
- `GET /reglas` (público): horario semanal con cierre de cocina, días especiales, desfase UTC y límites
  (antelación 60 min, margen de cierre 30 min, 50 personas, 99 por platillo). El administrador los puede
  ajustar sin desplegar con la clave `reglas_operacion` de `system_settings`.
- El API valida reservas (pasada, antelación, horario, días especiales, personas) y pedidos de mesa
  (platillo agotado o fuera de la carta, cantidad, cocina abierta); el pago a domicilio exige cocina abierta.
- **Móvil:** el formulario de reservación lee esas reglas y avisa antes de enviar con **el mismo texto**
  que el servidor; sin conexión usa los mismos valores por defecto y el servidor vuelve a validar.
- **Decisión:** la hora del restaurante se calcula con el desfase que manda el API, no con la zona del
  teléfono ni con `Intl` (Hermes no garantiza zonas horarias).
- Pendiente para la tanda: reservar a las 2 a. m. y 15 min antes del cierre (rechazo con el texto), y
  pedir un platillo agotado.

## B-017 · 2026-11-14 · Paridad: estado de las reservaciones en la móvil [movil] [web]

- Análisis de paridad web ↔ móvil del 13-nov (fuera del repositorio). Lo que más falta en la móvil es de
  administración; lo que más falta en la web son funciones de operación que la móvil ya tiene (cancelar
  pedido, notas, incidencias, cuenta dividida, reservas del mesero).
- **Hecho:** el administrador cambia el estado de una reservación desde la móvil con los mismos cinco
  estados y pasos que la web («Cambiar estado» → estado → motivo obligatorio al cancelar → «Guardar
  estado»), con `PATCH /reservations/:id`. Los demás roles solo consultan (el API lo exige).
- **Texto igualado:** el estado `pendiente` se muestra «Pendiente», como en la web (antes «Por confirmar»).

## B-018 · 2026-11-14 · Elegir mesa al reservar y disponibilidad en la hora del restaurante [movil] [api] [decision]

- **API** (PR #145): `GET /reservations/availability` interpretaba la fecha con la zona del servidor; en
  Render buscaba mesas libres seis horas antes. Ahora usa la zona y la duración del restaurante.
- **Móvil:** al elegir fecha y personas, el formulario muestra «Mesa» con «Asignar automáticamente» y las
  mesas libres con su capacidad, y manda `mesaId`. Cambiar la fecha o las personas reinicia la elección.
- **Decisión (administración):** se conserva «Asignar automáticamente» como opción por defecto: por
  teléfono, el personal no siempre sabe qué mesa conviene y el API elige una libre con lugar.

## B-019 · 2026-11-14 · Carta básica para el administrador en la móvil [movil] [decision]

- En la ficha del platillo, el administrador ve «Administrar platillo»: interruptor «Disponible para
  pedir» y «Precio ($)» con «Guardar precio» (`PATCH /platillos/:id`). Agotar un platillo lo bloquea al
  momento en la app, en la web y en el API (regla de la Fase 3).
- **Decisión (administración):** en servicio lo urgente es agotar un platillo y corregir un precio; el alta
  completa, las imágenes y la importación siguen en la web (formularios largos, mejor en pantalla grande).

## B-020 · 2026-11-14 · Existencias bajas en la cocina de la móvil [movil]

- «Incidencias y mermas» de cocina suma «Existencias bajas»: productos en o por debajo de su mínimo
  (`minStock` de `GET /inventario/productos`), los más escasos primero, con «Quedan X · mínimo Y». Es el
  mismo dato del panel lateral de cocina en la web. Un producto sin mínimo no aparece.

## B-021 · 2026-11-14 · Importar la carta y personal dado de baja [api] [web] [movil] [decision]

- **Fase 4.2 y 4.3 (API #147, web #18):** `POST /platillos/importar` con Excel o CSV y vista previa
  (`confirmar=false`). Al reemplazar, lo que no viene queda **deshabilitado, nunca se borra**; con filas
  con error se ofrece «Importar de todas formas» (`forzar=true`). La web pregunta «¿Agregar a la carta o
  reemplazarla?», muestra nuevos, actualizados, a deshabilitar, categorías nuevas, avisos y errores, y
  suma los filtros «Deshabilitados (agotados)» y «Sin imagen». Se quitó `xlsx` (SheetJS 0.18.5, con
  vulnerabilidades conocidas) de la web: ahora lee las hojas el API.
- **Hallazgo:** `GET /users` solo devolvía activos, así que «Activar» no se podía usar ni en la web.
  API #148 añade `incluirInactivos=true` (sin el parámetro responde igual que antes) y web #19 lo usa.
- **Fase 2, «Personal» en la móvil:** Dashboard → «Personal»: lista con activos e inactivos, búsqueda,
  filtro, alta (mismos campos y mensajes que la web), edición con cambio de rol y desactivar o activar con
  confirmación. **Decisión:** el correo y la contraseña no se editan aquí (el API no lo admite en
  `PATCH /users/:id`); cada persona cambia su contraseña desde su perfil.

## B-022 · 2026-11-14 · Nómina con periodo libre y empleados en la móvil [movil] [decision]

- «Nómina» ya no está fija en la semana actual: «Semana anterior», «Semana siguiente» y «Desde»/«Hasta»
  libres (AAAA-MM-DD, fechas reales y en orden), como el periodo de la web.
- Dashboard → «Empleados de la nómina»: añadir, editar (nombre, puesto, pago semanal, activo), activar o
  desactivar y quitar con confirmación, con los mismos mensajes que la web. Al cambiar un empleado se
  recalcula el neto del periodo.
- **Decisión:** fechas como texto en lugar del selector nativo: la web usa campos de fecha libres y
  el selector nativo no se puede automatizar en Maestro (ver CN-09); la semana anterior o siguiente cubre
  el uso diario.

## B-023 · 2026-11-13 · Fase 6: la móvil con los tokens de la web [movil] [web] [decision]

- `scripts/tokens-desde-web.mjs` lee `styles/tokens.css` de la web y genera
  `src/shared/presentation/theme/webTokens.ts` (21 colores del tema claro, 4 radios, velo del diálogo).
  `colors.ts` y `radius` ya no tienen valores propios: nombran los de la web con las claves de siempre,
  así que ninguna pantalla cambió de código. El naranja anterior (#e85d04) pasa al oro viejo de la web
  (#835E25), también en el color de las notificaciones (`app.json`).
- **Decisión:** la móvil usa el tema **claro** de la web (la web arranca en oscuro). En sala y caja se
  usa de día y con luz; el claro da mejor lectura al sol. Un modo oscuro en la móvil queda fuera de la
  entrega.
- Fondos suaves de estados: mezcla al 12 % sobre la superficie, como `color-mix` de las insignias web.
- Pendiente en el teléfono (Tanda 1): revisar contraste y radios en pantallas reales.

## B-024 · 2026-11-13 · Escribir al cliente de una reservación [movil] [web]

- Fase 4.6: en «Cambiar estado» de una reservación, «WhatsApp» y «Correo» con el saludo listo; sin
  teléfono o correo válido, el botón queda desactivado y lo dice. La web suma «Correo» junto a
  «WhatsApp» (web #21). Mismas reglas de número que la web (`contact.ts`).

## B-025 · 2026-11-13 · Facturas del administrador en la móvil [movil] [decision]

- Dashboard → «Facturas»: solicitudes pendientes con cliente, RFC, razón social, total y si el pago está
  confirmado; «Emitir» (solo con el pago confirmado; avisa si el correo no salió) y «Rechazar» con
  motivo de 5 a 300 caracteres (mismo mensaje que el API). Mismas rutas que la web.
- **Decisión:** en la móvil solo la bandeja de pendientes; el historial de facturas emitidas y su
  descarga se quedan en la web.

## B-026 · 2026-11-13 · API y web: despliegue, seguridad y Fase 4 [api] [web] [bd] [decision]

- **Despliegue (no ejecutado):** `main` tenía el hotfix #136 que `develop` no; el PR #135 ya no entraba
  limpio, así que API #150 lo trae con los conflictos resueltos (DM-20). Plan completo en
  `docs/despliegue-produccion.md` del API (#151): faltan en producción las tablas `consentimientos`,
  `refresh_tokens` y `solicitudes_factura` (comprobado en solo lectura).
- **Seguridad:** API #152 corrige 1 crítica (`proxy-addr`) y 5 altas sin cambios mayores; la web dejó
  `xlsx`. Checkout web con sesión (web #20): sin token, el pago en línea no funcionaba.
- **Fase 4:** OTP solo diseño (API #153); `GET/PUT /sitio` para las imágenes de la landing y el
  teléfono/WhatsApp (API #154; falta la pantalla web, al final del plan); accesibilidad usable sobre el
  menú lateral en móvil (web #22: dos versiones de la capa de Radix no se coordinaban); índice fijo en
  la carta y menú de categorías en la del admin (web #23, #24). Paginación en servidor descartada por
  medición (127 KB / 7,9 KB gzip; DM-19).
- **Fase 5 y 7:** scripts de datos de prueba con reversa (API #149); carta nueva (143 platillos) y
  paquetes como promociones listos en `_entrada/importacion-carta/`, probados en local, sin aplicar.

## B-027 · 2026-11-13 · Paridad en la web y la hora del restaurante [web] [api] [decision]

- La web adopta lo que ya hacía la móvil: cuentas en servicio con cobro por adelantado (web #26), notas
  por platillo y generales en sala (#27) y en cocina (#28), corte con diferencia en vivo (#29),
  cancelar un pedido con motivo en los primeros 2 minutos (#30), incidencias de cocina (#31) y
  reservaciones de hoy para el mesero (#32).
- **Hallazgo (afecta también a la app):** el API calculaba «hoy» con la medianoche del servidor (UTC en
  Render). Desde las 18:00 de Huejutla desaparecían de caja y cocina los pedidos abiertos antes, las
  incidencias y mermas del día se reiniciaban y la gráfica de ventas por hora salía corrida 6 horas.
  Corregido en API #155 y #156 con la zona del restaurante (DM-22). `/pedidos/admin/recent` además
  limitaba filas de platillos en vez de pedidos.

## B-028 · 2026-11-13 · Fotos y contacto del sitio administrables (P1.5) [web] [api] [decision]

- «Sitio web» en el panel del administrador (web #36): hasta 5 fotos de portada, foto de inicio de
  sesión y de registro, color de respaldo, teléfono y WhatsApp (`PUT /sitio`, API #154).
- La landing (web #37) funde encima de la foto de siempre las del administrador, con carrusel que se
  detiene con «reducir movimiento»; login, registro y «Visítanos» usan lo mismo.
- **Decisión:** `/sitio` se pide en el navegador y no en el servidor: con `await` en el servidor la
  portada dejaba de pintarse al instante (la foto LCP debe salir en el HTML sin esperar al API).

## B-029 · 2026-11-13 · La web al día con la móvil [web] [decision]

- Tiempo real con el mismo flujo de eventos que la app (web #38), cuenta dividida en partes iguales y
  referencia de terminal (#39), propina por porcentaje (#35), atender pedidos desde el Inicio del admin
  (#33) y los mismos textos de acciones (#34).
- **Decisión:** la propina sugerida se calcula sobre lo que se cobra en ese momento (la parte o lo que
  falta), igual que la app. Queda pendiente la cuenta por platillo en la web.

## B-030 · 2026-11-13 · Promociones y existencias del administrador en la móvil [movil] [decision]

- Dashboard → «Promociones»: lista con vigencia, precio y estado; activar o desactivar
  (`PATCH /promociones/:id`). Dashboard → «Existencias»: todos los productos, primero los que están en
  su mínimo (misma regla que cocina).
- **Decisión:** crear o editar promociones con imagen, registrar entradas de inventario y proveedores
  se quedan en la web (formularios largos y subida de imágenes); en la app, lo que se resuelve de pie
  durante el servicio.

## B-031 · 2026-11-14 · Tanda 1 en el Pixel 10a (Release por USB) [movil] [prueba] [decision]

- **Build de Release roto desde #462 (Stripe):** el lint vital de Gradle y R8 piden clases de push
  provisioning que no usamos (`play-services-tapandpay` no está en Maven). Config plugin
  `plugins/with-lint-release-off.js` y `-dontwarn com.stripe.android.pushProvisioning.**` (#476). Sin
  esto, el build de EAS para Play también fallaba.
- **Cierre de la app en Perfil → Privacidad** (`RangeError: Invalid time value`): el API manda los
  `timestamptz` como los imprime Postgres y Hermes no los entiende. Mismo riesgo en Facturas (#474).
  **Decisión:** normalizar una sola vez en los formateadores compartidos con `toIsoTimestamp` (#479), en
  lugar de cambiar las 69 columnas del API a ISO a 9 días de la entrega.
- **Barra de estado:** con el teléfono en oscuro, la hora salía blanca sobre fondo claro. Barra oscura
  en toda la app y clara solo en el login (#478).
- **Maestro:** los fallos eran del arnés (teclado, listas largas, permisos que Maestro concede solo,
  «atrás» en Android). Corregidos en #477; la semilla local deja `baja@prueba.local` sin consentimientos.
- **Tiempo real por el túnel:** el túnel rápido de Cloudflare retiene el flujo SSE (llegan las
  cabeceras, ningún evento en 50 s); en local llega al instante. La app cae al refresco de 30 s, así
  que HU-06 no se cumple «en segundos» por el túnel. Pendiente: comprobarlo contra producción (Render).

## B-032 · 2026-11-14 · Tanda 1: resultados y aviso de notificaciones [movil] [prueba]

- **Maestro en Release: 9 de 9** (`_entrada/evidencias/tanda1/junit-release.xml`, no versionado).
- **Aviso de notificaciones (#480):** en una instalación limpia de Android 13+ nunca aparecía; Expo
  entrega `denied` con `canAskAgain` y la app solo explicaba con `undetermined`. Verificado tras el
  arreglo instalando de cero y abriendo con `am start` (sin que Maestro toque permisos).
- **Sincronización web ↔ móvil (API local, web en build de producción):** el admin agota un platillo
  en la web y el mesero lo ve «Agotado» en el teléfono; el mesero envía un pedido a B01 desde el
  teléfono y la cocina de la web lo muestra al cargar.
- **Rendimiento en el Pixel:** arranque en frío 138 ms (primer fotograma), PSS 163 MB, 1,3 % de
  fotogramas lentos; las tres metas se cumplen (`docs/rendimiento-movil.md`).

## B-033 · 2026-11-14 · El pinning no cubría el fetch (Expo 58) [movil] [seguridad] [decision]

- En la prueba CN-20 (pin falso para el túnel) la app entraba igual. Diagnóstico en el Pixel: la
  librería estaba disponible e inicializada, pero Expo 58 sustituye el `fetch` global por
  `expo/fetch`, que no pasa por el cliente OkHttp de React Native donde vive el `CertificatePinner`.
- **Decisión:** usar el `fetch` de React Native (`EXPO_PUBLIC_USE_RN_FETCH=1`, la opción documentada
  por Expo) en todos los perfiles de EAS, en lugar de cambiar de librería o escribir un módulo
  nativo. Con eso, el pin falso se rechaza con el aviso «La conexión no es segura…» (CN-20).
- Prueba nueva: falla si un perfil de `eas.json` no define la variable. Maestro en Release repetido
  completo con el cambio.

## B-034 · 2026-11-14 · Lighthouse de la web, antes y después [web] [rendimiento]

Lighthouse 13.6 con Chromium sin interfaz, build de producción de la web contra el API local, una
corrida por página (rendimiento / accesibilidad / buenas prácticas / SEO). Informes en
`_entrada/lighthouse/{antes,despues}/` (no versionados).

| Página | Antes (móvil · escritorio) | Después (móvil · escritorio) |
|---|---|---|
| Landing | 91/100/96/100 · 97/100/96/100 | 94/100/96/100 · 96/100/96/100 |
| Carta | 79/100/96/100 · 95/100/96/100 | 77/100/96/100 · 95/100/96/100 |
| Login | 97/100/96/100 · 94/100/96/100 | 78/100/96/100 · 94/100/96/100 |
| Dashboard del mesero | 69/99/100/100 · 85/99/100/100 | 89/99/100/100 · 85/99/100/100 |

- **Corregido (web #44):** las tarjetas indicadoras crecían 36 px al llegar los datos (CLS); ahora el
  esqueleto mide lo mismo (182 px en ambos estados, medido con el API retrasado).
- **No corregido, con motivo:** buenas prácticas 96 por el 401 de `/api/auth/me` sin sesión
  (comportamiento documentado y probado; cambiarlo toca a todos los consumidores de la sesión). El
  bloqueo del hilo principal en móvil es la hidratación de React DOM (chunk de 235 KB), sin arreglo
  rápido. Lighthouse aún marca ~0,16 de CLS en el dashboard de escritorio, atribuido a otro elemento
  fijo; sin estrangulamiento el CLS medido es 0,038.
- **Ruido:** una sola corrida por página. Login móvil bajó de 97 a 78 sin cambios en esa página
  (TBT 185 → 1 028 ms); para comparar en serio, mediana de 3 con `scripts/comparar-rendimiento.mjs`.

## B-035 · 2026-11-14 · División de cuentas y pagos: auditoría y pruebas [pagos] [api] [web] [movil] [pruebas] [gh-project]

La rúbrica no pide división ni facturación. En GitHub Projects, api#81 pide la integración con Stripe
(intento → webhook firmado → pagado, webhook repetido y rechazo). Paridad (detalle en el reporte no
versionado `_entrada/reportes/pruebas-division-facturacion-pagos.md`):

- **Ya había:** completa, partes iguales, por platillo, pagos mixtos (cada parte con su método) y
  propina por parte, en web y móvil. No existe la división «por porcentaje»: el porcentaje es solo
  para la propina. La móvil precarga los comensales y pasa sola a la siguiente persona; la web hace
  elegir cuántas personas faltan.
- **Suite de integración contra el API real** (API #164, `pnpm test:integracion`, fuera de CI): 21
  casos con Stripe en modo test (`stripe listen`). 100.01 entre 3 da 33.34 + 33.34 + 33.33; dos cajas
  a la vez dejan un solo pago; el webhook es idempotente; probadas las tarjetas de prueba aprobada,
  fondos insuficientes y 3D Secure.
- **Corregido en el API:**
  - #161: webhook atómico; un cobro doble se reembolsa solo.
  - #161: con tarjeta ya elegida daba 500 por `return_url`; un rechazo ahora responde 402 con mensaje.
  - #163: reembolso y reversa de pagos (solo admin).
- **Maestro** `s3-hu05-cuenta-dividida`: la misma cuenta de 100.01 cobrada en el Pixel (Release) con
  efectivo, tarjeta y efectivo.

## B-036 · 2026-11-14 · Facturación: el CFDI no amparaba lo cobrado [facturacion] [api] [web] [decision]

- **Fallo grave (ya existía):** Facturapi toma el precio con IVA incluido por omisión y el API le
  mandaba el subtotal. Un consumo de $100.01 se timbraba por $86.22, comprobado en el sandbox.
  Corregido en API #162: se manda el total con `tax_included: true`.
- **También en #162:**
  - Forma de pago del pago de mayor monto (antes siempre 31).
  - Un solo CFDI por orden: la solicitud se aparta y lleva `idempotency_key`.
  - Catálogos del SAT en el DTO.
  - Caja y administración pueden pedir la factura de una cuenta en mesa (también una dividida).
  - `POST /facturas/:id/cancelar` con motivo 02 o 03; con 02 la solicitud vuelve a la cola.
- **Web #45:**
  - Caja ofrece la factura al cerrar la cuenta.
  - El admin cancela una factura.
  - El uso «P01» (no existe en CFDI 4.0) cambia por S01.
- **Decisión:** el CFDI ampara el consumo sin la propina. Una cuenta dividida se factura completa
  (un CFDI por orden), no por persona.
- **Pendiente propuesto:** pedir la factura y cancelarla desde la móvil, y una pantalla de reembolso.
  No lo pide la rúbrica.

