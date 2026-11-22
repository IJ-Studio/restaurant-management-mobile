# Seguridad de los datos en Google Play · borrador para la 1.1.0

Borrador campo por campo para **Play Console → Contenido de la app → Seguridad de los datos**, revisado el 21-nov-2026 contra el código de `develop` con el pulido (#487) y el manifiesto del Release compilado el 20-nov. Actualiza [`../google-play-seguridad-datos.md`](../google-play-seguridad-datos.md) (que no tenía Stripe ni la nómina). Lo marcado **CONFIRMAR** no se puede asegurar desde el código: lo decide el responsable antes de enviar.

## 0. Base técnica comprobada

| Punto | Evidencia |
|---|---|
| Permisos de Android (Release) | `INTERNET`, `ACCESS_NETWORK_STATE`, `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `VIBRATE`, `WAKE_LOCK`, `c2dm.RECEIVE` (FCM), `NFC` (lo añade `com.stripe:paymentsheet`), `BIND_GET_INSTALL_REFERRER_SERVICE` (lo añade `expo-application`; el código no lo usa) y permisos de insignias de lanzadores. Bloqueados en `app.json`: almacenamiento externo, superposición, biometría. **Sin** ubicación, cámara, micrófono, contactos ni archivos |
| API objetivo | `targetSdkVersion` 36, `minSdkVersion` 24 |
| Cifrado en tránsito | `src/core/http/httpClient.ts:173`: fuera de desarrollo, se rechaza una URL de API sin `https://`. Certificate pinning del API (#455, #481). Stripe, Sentry y Expo usan HTTPS |
| Almacenamiento local | Solo la sesión, en `expo-secure-store` (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`); no hay AsyncStorage ni archivos |
| Pagos | Stripe PaymentSheet (`StripePaymentGateway.ts`): la tarjeta se captura en la hoja de Stripe y va directo a Stripe; la app y el API solo manejan el `clientSecret` del intento |
| Notificaciones | `getExpoPushTokenAsync` (Expo Push sobre FCM); el token se registra en el API (`POST notifications/devices`, `{ token, platform }`) solo si la persona acepta los avisos |
| Sentry | `@sentry/react-native` 8.28, DSN definido en EAS `production`; `sendDefaultPii: false`; `scrub.ts` quita tokens, correos, teléfonos, nombres, RFC, tarjetas y query strings; sin `setUser`, sin trazas de rendimiento ni Replay. La preferencia «Reportes de errores» de Privacidad corta los eventos de JavaScript |
| Creación de cuentas | No hay registro: `auth/sign-up` no se llama desde la app. El administrador da de alta al personal (`POST users`) |
| Borrado de cuenta | En la app: Privacidad → Eliminar mi cuenta (`DELETE /account`, con contraseña; existe en el API de producción). En la web: `https://el-quijote.vercel.app/eliminar-cuenta` (200 el 21-nov) |

## 1. Preguntas generales

| Pregunta | Respuesta | Motivo |
|---|---|---|
| ¿La app recopila o comparte alguno de los tipos de datos requeridos? | **Sí** | Sesión, perfil, reservaciones, pedidos y cobros, nómina, token de avisos, pagos con tarjeta y reportes de errores |
| ¿Todos los datos recopilados se cifran en tránsito? | **Sí** | Ver §0 |
| ¿Ofreces una forma para que los usuarios soliciten la eliminación de sus datos? | **Sí** | En la app y en la web (§4) |
| Validación independiente de seguridad (MASA) | No | Opcional |

«Compartir» en Play = enviar datos a un tercero que los usa para sus propios fines. Render y Supabase (API y base de datos), Stripe (cobro), Sentry (errores), Expo y Firebase Cloud Messaging (avisos) y Facturapi (timbrado, desde el API) **tratan los datos por cuenta del restaurante**: no cuentan como compartir. **CONFIRMAR** que los contratos o términos de cada uno los ubican como encargados (Stripe procesa también para prevenir fraude por su cuenta: ver §3, nota de Stripe).

## 2. Tipos de datos

| Categoría → tipo | ¿Recopilado? | ¿Compartido? | ¿Efímero? | ¿Obligatorio u opcional? | Finalidades | De dónde sale en el código |
|---|---|---|---|---|---|---|
| Información personal → **Nombre** | Sí | No | No | Obligatorio | Funcionalidad de la app; Gestión de la cuenta | Perfil (`PUT profile`); cliente en reservaciones (`clienteNombre`); alta de personal (`name`, `lastname`); empleados de nómina |
| Información personal → **Dirección de correo electrónico** | Sí | No | No | Obligatorio | Gestión de la cuenta; Funcionalidad de la app | Inicio de sesión (`auth/sign-in`); perfil; reservación (`clienteEmail`); alta de personal |
| Información personal → **ID de usuario** | Sí | No | No | Obligatorio | Gestión de la cuenta; Funcionalidad de la app | Id de la sesión, pedidos, cobros y consentimientos |
| Información personal → **Número de teléfono** | Sí | No | No | **Obligatorio** (la reservación y el alta de personal lo piden) — **CONFIRMAR** | Funcionalidad de la app | `clienteTelefono` (requerido en `CreateReservationDto`); `phone` en `StaffInput`; perfil |
| Información financiera → **Información de pago del usuario** | **Sí (nuevo)** | No | No | **Opcional** (se puede pagar en efectivo o con terminal) | Funcionalidad de la app | Hoja de pago de Stripe (#462). La app no ve ni guarda el número de tarjeta |
| Información financiera → **Historial de compras** | **Sí** | No | No | Obligatorio | Funcionalidad de la app | Pedidos, cobros, propinas y cuenta dividida (`pedidos/*`, `pagos/crear-intento`) |
| Información financiera → **Otra información financiera** | **Sí — CONFIRMAR** | No | No | Obligatorio (solo para el rol de administrador) | Funcionalidad de la app | Nómina: pago semanal, bonos y descuentos del personal (`payroll`, `payroll/movimientos`); emitir o rechazar solicitudes de factura (`solicitudes-factura/*`) |
| Actividad en la app → **Otro contenido generado por el usuario** | Sí | No | No | Opcional | Funcionalidad de la app | Notas del pedido, peticiones especiales y ocasión de la reservación, incidencias y mermas de cocina, motivos de cancelación, justificaciones de nómina |
| Actividad en la app → **Interacciones en la app** | **CONFIRMAR** (sugerido: Sí) | No | No | Obligatorio | Analíticas (estabilidad) | Sentry adjunta a cada error migas de toques (`Sentry.wrap`), de consola y de peticiones (URL sin query); no hay analíticas de uso |
| Información y rendimiento de la app → **Registros de fallos** | Sí | No | No | **Obligatorio — CONFIRMAR** (ver nota de Sentry) | Analíticas | Sentry: errores de JavaScript y cierres nativos |
| Información y rendimiento de la app → **Diagnóstico** | Sí | No | No | Obligatorio — CONFIRMAR | Analíticas | Sentry: modelo y sistema del teléfono, versión de la app, sesiones de estabilidad |
| ID del dispositivo u otros → **ID del dispositivo u otros** | Sí | No | No | Opcional (solo si acepta avisos) — **CONFIRMAR** que el id de instalación de Sentry y el de Firebase no lo vuelven obligatorio | Funcionalidad de la app | Token de Expo Push / FCM (`notifications/devices`); id de instalación de Sentry y de Firebase |

**No se recopila** (sin permisos ni código que lo haga): ubicación, contactos, fotos y videos, audio, archivos y documentos, calendario, salud y actividad física, mensajes, historial web, apps instaladas, información de búsqueda. La app no tiene anuncios.

### Notas

- **Sentry y la preferencia «Reportes de errores».** El filtro de `src/core/monitoring/sentry.ts` (`beforeSend`) actúa sobre los eventos de JavaScript. Los cierres nativos de Android los captura el SDK nativo, que **no** pasa por ese filtro: se enviarían aunque la persona apague la preferencia. Por eso se sugiere «Obligatorio». **CONFIRMAR** con una prueba o con la documentación de Sentry; si se quiere que la preferencia lo apague todo, hace falta un cambio de código. Además, en Sentry → proyecto → Security & Privacy, **CONFIRMAR** que «Prevent Storing of IP Addresses» está activo (el SDK no manda la IP con `sendDefaultPii: false`, pero el servidor puede tomarla de la conexión). Si se decide quitar Sentry del build, se borran las filas de «Interacciones», «Registros de fallos» y «Diagnóstico» y el id de instalación de Sentry.
- **Stripe.** Play cuenta como recopilado lo que recoge un SDK dentro de la app. **CONFIRMAR** con la guía de Stripe para la sección de seguridad de los datos de Google Play (docs.stripe.com) qué datos de dispositivo recoge el SDK de Android para prevenir fraude y si Stripe los declara como suyos; si la guía lo indica, añadir esas filas.
- **`NFC`** lo trae la hoja de pago de Stripe (lectura de tarjetas sin contacto). No es un tipo de dato, pero Play puede preguntar. **CONFIRMAR** si se quiere retirarlo con `blockedPermissions` (habría que probar la hoja de pago).
- **Install Referrer** (`expo-application`): la librería está en el build, pero ningún código la usa y no se envía nada.

## 3. Prácticas de seguridad

| Pregunta | Respuesta |
|---|---|
| Datos cifrados en tránsito | Sí |
| Los usuarios pueden pedir la eliminación de sus datos | Sí |
| Cumple la política de Familias | No aplica (18+; app de trabajo del personal) |

## 4. Eliminación de cuenta y datos

| Pregunta | Respuesta |
|---|---|
| URL del recurso web | `https://el-quijote.vercel.app/eliminar-cuenta` (200 el 21-nov; menciona correo y notificaciones; contacto `elquijote.atencion@gmail.com`) |
| ¿Se puede borrar la cuenta en la app? | Sí: Privacidad → Eliminar mi cuenta, con contraseña. La cuenta se desactiva y se anonimiza (DM-07) |
| ¿Qué se conserva? | Registros de nómina y fiscales que la ley obliga a guardar (DM-07). Decirlo en la respuesta de Play |
| ¿Se pueden borrar algunos datos sin borrar la cuenta? | Sí: datos de perfil desde la app; preferencias y avisos desde Privacidad; lo demás por correo |
| ¿La app permite crear cuentas? | No hay registro; el administrador da de alta al personal desde la app. **CONFIRMAR** cómo responderlo (en cualquier caso, la app ya ofrece el borrado dentro y fuera) |

## 5. URL

| Campo | URL | Comprobado el 21-nov (solo GET) |
|---|---|---|
| Política de privacidad | `https://el-quijote.vercel.app/privacidad` | 200, «Aviso de privacidad \| El Quijote»; menciona Sentry, Stripe, Expo/Firebase y ARCO |
| Eliminación de cuenta | `https://el-quijote.vercel.app/eliminar-cuenta` | 200, «Eliminar cuenta \| El Quijote» |

## 6. Cambios frente a la declaración anterior

1. **Agregar** «Información de pago del usuario» (Stripe), opcional.
2. **Marcar** «Historial de compras».
3. **Agregar** «Otra información financiera» (nómina y facturas) — CONFIRMAR.
4. **Decidir** «Interacciones en la app» (migas de Sentry) — CONFIRMAR.
5. Teléfono pasa a **obligatorio** — CONFIRMAR.
6. Sentry: mantener «Registros de fallos» y «Diagnóstico» si se queda; quitarlas si se retira.
