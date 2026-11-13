# Pruebas de caja negra (Debug y Release)

Pruebas funcionales de punta a punta en un Android real, sin acceso al código: se maneja la app como el
personal y se revisa lo que aparece en pantalla. Las automatiza [Maestro](https://maestro.dev) con los
flujos de `.maestro/acceptance/`; las capturas quedan en `reports/maestro/`.

## Cómo se ejecutan

1. API con HTTPS al que llegue el teléfono (en pruebas, el API local publicado con un túnel) y la base de
   pruebas con los usuarios `admin|cajero|mesero|cocina|baja@prueba.local` (contraseña `Prueba#2026`).
2. Instalar el build que se va a probar:
   - **Debug:** `npx expo run:android` (o el APK de depuración).
   - **Release:** `cd android && ./gradlew assembleRelease` con R8 y `shrinkResources` (ver
     [`reporte-ofuscacion-jadx.md`](reporte-ofuscacion-jadx.md)) e instalar `app-release.apk`.
3. Teléfono conectado por USB (`adb devices`) y:

```bash
APP_ID=com.ijstudio.restaurantmanagement API_URL=https://<api> npm run test:device
```

`npm run test:device` corre todos los flujos y deja `reports/maestro/junit.xml`. Un flujo suelto:
`maestro test -e API_URL=https://<api> .maestro/acceptance/s3-hu06-realtime.yaml`.

## Matriz funcional

Resultado: ✅ pasa · ❌ falla (ver el registro de errores) · ⏳ pendiente de ejecutar · ✋ manual.

| ID | Historia y criterio | Flujo | Resultado esperado | Debug | Release |
|---|---|---|---|---|---|
| CN-01 | HU-01 CA-3: credenciales inválidas | `s1-hu01-login` | «Correo o contraseña incorrectos.», sin entrar | ⏳ | ⏳ |
| CN-02 | HU-01 CA-1: login válido | `s1-hu01-login` | Entra y ve la sección de su rol | ⏳ | ⏳ |
| CN-03 | HU-02 CA-1: cocina solo ve Pedidos y Perfil | `s1-hu02-roles` | Sin Dashboard, Cobros ni Menú | ⏳ | ⏳ |
| CN-04 | HU-02: cerrar sesión no deja volver atrás | `s1-hu02-roles` | «Atrás» deja en el Login | ⏳ | ⏳ |
| CN-05 | HU-02 CA-2: el administrador ve su Dashboard y no Cobros | `s1-hu02-roles` | Dashboard visible, Cobros no | ⏳ | ⏳ |
| CN-06 | HU-03 CA-1: la carta llega del API con disponibilidad | `s2-hu03-menu` | Platillos y la marca «Agotado» | ⏳ | ⏳ |
| CN-07 | HU-03 CA-2: un platillo agotado no se agrega | `s2-hu03-menu` | Sin «Agregar al pedido» | ⏳ | ⏳ |
| CN-08 | HU-04 CA-2: reservación incompleta o con teléfono inválido | `s2-hu04-reservation` | No se envía y explica cada campo | ⏳ | ⏳ |
| CN-09 | HU-04 CA-1: reservación válida aparece en el listado | ✋ (selector nativo de fecha) | Aparece en Activas al guardar | ⏳ | ⏳ |
| CN-10 | HU-05 CA-3: el mesero envía el pedido de una mesa a cocina | `s3-hu05-order-to-kitchen` | «Pedido enviado a cocina» y cocina lo ve | ⏳ | ⏳ |
| CN-11 | HU-06: un pedido nuevo aparece sin refrescar | `s3-hu06-realtime` | Aparece en ≤ 10 s | ⏳ | ⏳ |
| CN-12 | HU-06: un cambio de estado aparece sin refrescar | `s3-hu06-realtime` | Cambia a «lista» en ≤ 10 s | ⏳ | ⏳ |
| CN-13 | HU-07 / permisos: explicación antes del permiso | `s4-hu07-permission` | «Avisos de pedidos» antes del diálogo del sistema | ⏳ | ⏳ |
| CN-14 | HU-08: el administrador ve el resumen del día | `s4-hu08-dashboard` | «Resumen del día» con indicadores | ⏳ | ⏳ |
| CN-15 | HU-08: otro rol no abre el dashboard | `s4-hu08-dashboard` | Sin Dashboard | ⏳ | ⏳ |
| CN-16 | ARCO: aviso con casilla sin marcar | `arco-privacy` | Sin marcar no se puede continuar | ⏳ | ⏳ |
| CN-17 | ARCO: oposición con switches | `arco-privacy` | El switch cambia y se guarda | ⏳ | ⏳ |
| CN-18 | ARCO: cancelación | `arco-privacy` | «Tu cuenta se eliminó.» y la cuenta ya no entra | ⏳ | ⏳ |
| CN-19 | Sesión: el API se reinicia con la app abierta | ✋ | La app sigue sin pedir contraseña | ⏳ | ⏳ |
| CN-20 | Pinning: certificado no confiable | ✋ (build con un pin erróneo) | «La conexión no es segura…» | — | ⏳ |
| CN-21 | Release: R8 no rompe la app | Todos los flujos sobre Release | Mismos resultados que en Debug | — | ⏳ |

## Registro de errores corregidos

Defectos encontrados al probar la app, con la versión donde aparecieron y dónde se corrigieron.

| ID | Fecha | Versión | Defecto | Causa | Corrección | Verificado |
|---|---|---|---|---|---|---|
| E-01 | 12-nov | Release 1.0.0 (Play, versionCode 9) | No se podía crear el pedido de una mesa | La app mandaba `usuarioId` y el API lo rechaza (el usuario sale del token) | App #451 y API #136 | ✅ en producción |
| E-02 | 12-nov | Release 1.0.0 | El manifest pedía almacenamiento y «mostrar sobre otras apps», y permitía respaldo de datos (`ALLOW_BACKUP`, visto con `dumpsys` en el teléfono) | Permisos por defecto de la plantilla y de librerías | App #454 (`blockedPermissions`, `allowBackup: false`) | ⏳ tanda |
| E-03 | 13-nov | Release 1.0.0 | El permiso de notificaciones aparecía al entrar sin explicar para qué | Se pedía al montar la navegación | App #458 (diálogo previo) | ⏳ tanda |
| E-04 | 13-nov | Release 1.0.0 | Entrar en la web con la misma cuenta cerraba la sesión de la app, y un reinicio del API cerraba todas | El API guardaba una sola sesión por usuario, en memoria | API #138 y app #456 (sesión por dispositivo y refresco) | ⏳ tanda |
| E-05 | 13-nov | Release 1.0.0 | «Eliminar cuenta» solo abría la web | No existía la ruta en el API | API #137 y app #457 | ⏳ tanda |

Cada defecto nuevo de una tanda se agrega aquí y se abre como issue con la etiqueta `bug`.
