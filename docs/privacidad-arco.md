# Privacidad y derechos ARCO

Cómo cumple la app con el consentimiento explícito y con los derechos de Acceso, Rectificación,
Cancelación y Oposición del personal sobre sus datos.

## Aviso de privacidad con consentimiento explícito

- Después de iniciar sesión, `PrivacyConsentGate` (dentro de `AuthGate`) consulta `GET /profile/privacidad`.
- Si la persona no ha aceptado la versión vigente del aviso (`PRIVACY_NOTICE_VERSION`), ve
  `PrivacyNoticeScreen` en lugar de la app:
  - qué datos trata la app y para qué, con enlace al aviso completo en la web;
  - una casilla **sin marcar**: «He leído y acepto el aviso de privacidad»;
  - «Aceptar y continuar» está deshabilitado hasta que se marca la casilla;
  - «No acepto, cerrar sesión» devuelve al Login.
- Al aceptar, el API guarda quién aceptó, qué versión, desde dónde (`origen: movil`) y cuándo.
- Se pide una sola vez por persona y por versión. Si cambia el texto del aviso se sube la versión y se
  vuelve a pedir.
- Si el API no responde, la app no detiene el servicio del restaurante: deja entrar y lo pide de nuevo al
  abrir la app.

## Derechos ARCO

| Derecho | Dónde se ejerce en la app | Endpoint del API |
|---|---|---|
| **Acceso** | Perfil y Perfil → Editar perfil | `GET /profile` |
| **Rectificación** | Perfil → Editar perfil | `PUT /profile` |
| **Cancelación** | Perfil → Privacidad → Eliminar mi cuenta | `DELETE /account` (también `DELETE /profile`) |
| **Oposición** | Perfil → Privacidad → Tus preferencias | `GET` y `PUT /profile/privacidad` |

El API toma al usuario del token en todas estas rutas: nadie puede leer, editar ni eliminar la cuenta de
otra persona.

## Oposición: preferencias de exclusión

| Switch | Al apagarlo |
|---|---|
| Avisos de pedidos | El API deja de enviar notificaciones push a los teléfonos de esa persona |
| Reportes de errores | La app deja de enviar informes de fallas (`beforeSend` de Sentry los descarta) |

Las dos empiezan encendidas y cada cambio queda registrado en el servidor con su fecha. La de reportes
es de la persona, no del teléfono: al cerrar sesión vuelve a su valor por defecto.

## Cancelación: eliminar la cuenta

1. La pantalla explica qué se borra y qué se conserva.
2. Pide la contraseña (confirma que quien elimina es el titular) y una confirmación en un diálogo.
3. El API, en una sola transacción:
   - sustituye nombre, apellido, correo, teléfono y contraseña, y desactiva la cuenta;
   - borra los teléfonos registrados para avisos;
   - conserva pedidos, cobros y nómina, que la ley obliga a guardar, enlazados a un usuario sin datos.
4. Se cierran todas las sesiones de esa persona y la app vuelve al Login con «Tu cuenta se eliminó.».

El único administrador activo no puede eliminarse: primero debe nombrar a otro.

## Código

| Capa | Archivos |
|---|---|
| Dominio | `src/features/privacy/domain/` (`PrivacySettings`, `PrivacyRepository`, `DeleteAccountUseCase`) |
| Datos | `src/features/privacy/data/` (`PrivacyRemoteDataSource`, `PrivacyRepositoryImpl`) |
| Presentación | `PrivacyConsentGate`, `PrivacyNoticeScreen`, `PrivacyScreen`, `DeleteAccountScreen` y sus ViewModels |
| Pruebas | `src/features/privacy/**/__tests__/` y `src/__tests__/integration/privacy.integration.test.tsx` |
