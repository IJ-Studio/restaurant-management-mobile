# Google Play: respuestas del formulario «Seguridad de los datos»

Respuestas sugeridas para **Play Console → Contenido de la app → Seguridad de los datos**, sacadas de lo
que hace el código de la app (`develop`). Lo marcado con **CONFIRMAR** lo decide el equipo antes de enviar.

## URL que se capturan

| Campo de Play Console | URL |
|---|---|
| Política de privacidad (Contenido de la app → Política de privacidad) | `https://el-quijote.vercel.app/privacidad` |
| Recurso web para eliminar la cuenta (Seguridad de los datos → Eliminación de datos) | `https://el-quijote.vercel.app/eliminar-cuenta` |

Las dos páginas son de servidor (HTML sin sesión) y viven en el repo web. Si la web cambia de dominio,
actualiza estas URL y `EXPO_PUBLIC_WEB_URL` (la usa Perfil → «Aviso de privacidad» / «Eliminar cuenta»).

## Preguntas generales

| Pregunta | Respuesta | Por qué |
|---|---|---|
| ¿La app recopila o comparte alguno de los tipos de datos requeridos? | **Sí** | Inicio de sesión, reservaciones, pedidos, token de notificaciones y reportes de errores |
| ¿Todos los datos se cifran en tránsito? | **Sí** | `httpClient` rechaza URLs sin HTTPS fuera de desarrollo; Sentry y Expo usan HTTPS |
| ¿Ofreces una forma de solicitar la eliminación de los datos? | **Sí** | `/eliminar-cuenta` (por correo, teléfono o en el restaurante) y el enlace en Perfil |
| ¿La app cumple la política de Familias? | No aplica: público objetivo de 18 años o más | Es una app de trabajo para el personal |
| ¿Validación independiente de seguridad (MASA)? | No | Opcional |

«Compartir» en Play significa enviar datos a terceros que los usan para sus propios fines. Supabase,
Render, Sentry y Expo/FCM son **proveedores que tratan los datos por cuenta del restaurante**, así que
no cuentan como compartir (Google lo excluye expresamente).

## Tipos de datos

| Categoría → tipo | ¿Se recopila? | ¿Se comparte? | ¿Obligatorio? | Finalidad | Dónde está en el código |
|---|---|---|---|---|---|
| Información personal → **Nombre** | Sí | No | Obligatorio | Funcionalidad de la app; Gestión de la cuenta | Perfil del personal; nombre del cliente en reservaciones y pedidos |
| Información personal → **Dirección de correo electrónico** | Sí | No | Obligatorio | Gestión de la cuenta | Login (HU-01), Perfil |
| Información personal → **ID de usuario** | Sí | No | Obligatorio | Gestión de la cuenta; Funcionalidad de la app | Id del usuario en la sesión y en pedidos y cobros |
| Información personal → **Número de teléfono** | Sí | No | Opcional | Funcionalidad de la app | Teléfono del cliente en la reservación (HU-04) |
| Información financiera → **Historial de compras** | **CONFIRMAR** (sugerido: Sí) | No | Obligatorio | Funcionalidad de la app | Pedidos y cobros (monto, método, propina). No se guardan tarjetas |
| Actividad en la app → **Otro contenido generado por el usuario** | Sí | No | Opcional | Funcionalidad de la app | Notas del pedido, incidencias y mermas de cocina |
| Información y rendimiento de la app → **Registros de fallos** | Sí | No | Obligatorio | Analíticas (estabilidad) | Sentry (`src/core/monitoring`), sin tokens, correos ni datos personales (`scrub.ts`) |
| Información y rendimiento de la app → **Diagnóstico** | Sí | No | Obligatorio | Analíticas (estabilidad) | Sentry: modelo de teléfono, versión de la app, trazas |
| ID de dispositivo u otros → **ID de dispositivo u otros** | Sí | No | Opcional (solo si acepta notificaciones) | Funcionalidad de la app | Token push que se registra en el API (HU-07) |

**No se recopila:** ubicación, contactos, fotos o videos, archivos, calendario, audio, salud, mensajes,
historial web, apps instaladas, ni datos de pago (tarjetas). La app no tiene anuncios.

> **CONFIRMAR** si Sentry está activo en el build (`EXPO_PUBLIC_SENTRY_DSN`). Si va vacío, la app no
> envía reportes y las dos filas de «Información y rendimiento» se pueden quitar.

## Sección de eliminación

| Pregunta | Respuesta |
|---|---|
| ¿Los usuarios pueden pedir que se borre su cuenta? | Sí |
| URL del recurso web | `https://el-quijote.vercel.app/eliminar-cuenta` |
| ¿Pueden pedir que se borren algunos datos sin borrar la cuenta? | Sí: direcciones y datos de facturación por correo; el token de notificaciones, apagándolas en el teléfono |
| ¿La app permite crear cuentas? | No: las da de alta la administración. Por eso Play no exige el borrado dentro de la app, pero Perfil enlaza a la página |

## Lo que falta antes de enviar

- [x] `config/legal.ts` de la web con el responsable (Alejandro Daniel Monterrubio Caballero), el correo
      `elquijote.atencion@gmail.com` y el desarrollador de Play (Angel Uriel Martinez Hernandez).
- [ ] Publicar la web con esas páginas (rama `developer` → producción en Vercel).
- [ ] Revisar las filas marcadas con **CONFIRMAR**.
