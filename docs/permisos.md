# Permisos de Android

La app pide solo lo que usa. Esta tabla sale del manifest combinado del build de release
(`android/app/build/intermediates/merged_manifest/release/…/AndroidManifest.xml`), revisado el 13 de
noviembre de 2026.

## Permisos que declara la app

| Permiso | Quién lo añade | Para qué | ¿Se pide al usuario? |
|---|---|---|---|
| `INTERNET` | React Native | Hablar con el API del restaurante | No (permiso normal) |
| `ACCESS_NETWORK_STATE` | React Native | Saber si hay conexión antes de reintentar | No |
| `POST_NOTIFICATIONS` | `expo-notifications` | Avisos de pedidos listos o por cobrar | **Sí**, en tiempo de ejecución (Android 13 o superior) |
| `VIBRATE` | `expo-notifications` y `expo-haptics` | Vibración de los avisos y de las acciones | No |
| `WAKE_LOCK`, `RECEIVE_BOOT_COMPLETED`, `com.google.android.c2dm.permission.RECEIVE` | `expo-notifications` y Firebase Cloud Messaging | Recibir avisos con la pantalla apagada y tras reiniciar el teléfono | No |
| `READ_APP_BADGE` y los permisos de contador de cada fabricante (Samsung, Huawei, Sony, HTC, Oppo…) | `expo-notifications` | Mostrar el número de avisos pendientes en el ícono | No |

El único permiso sensible es el de notificaciones. La app no usa cámara, ubicación, micrófono, contactos
ni almacenamiento compartido.

## Cómo se pide el permiso de notificaciones

El permiso del sistema nunca aparece solo. `NotificationPermissionPrompt` (se monta al entrar con sesión)
sigue este orden:

1. Consulta el permiso **sin** mostrar el diálogo del sistema.
2. Si nunca se ha preguntado, muestra un diálogo propio que explica para qué es:

   > **Avisos de pedidos**
   > El Quijote te avisa cuando un pedido está listo para entregar o para cobrar, aunque tengas la app
   > cerrada. Para eso necesita tu permiso para mostrar notificaciones. Solo se usan para avisos del
   > servicio y puedes apagarlos cuando quieras en Perfil → Privacidad.

3. «Activar avisos» abre el permiso del sistema. «Ahora no» cierra el diálogo sin pedirlo; no se vuelve a
   mostrar hasta abrir la app otra vez.
4. Con el permiso concedido, la app registra el teléfono en el API (`POST /notifications/devices`) para
   que le lleguen los avisos de esa persona. Al cerrar sesión lo da de baja.
5. Si la persona ya lo negó, la app no insiste: en Perfil aparece el estado y un botón para activarlo o
   para abrir Ajustes.

La app funciona completa sin este permiso: los pedidos se siguen viendo en su lista.

## Permisos retirados

Vienen en la plantilla de Expo o en alguna librería, la app no los usa y se bloquean en `app.json`
(`android.blockedPermissions`), que los marca con `tools:node="remove"` en el manifest:

| Permiso | Por qué se retira |
|---|---|
| `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE` | La app no lee ni escribe archivos del usuario |
| `SYSTEM_ALERT_WINDOW` | Dibujar sobre otras apps solo sirve a las herramientas de desarrollo |
| `USE_BIOMETRIC`, `USE_FINGERPRINT` | Los declara `expo-secure-store`; la app no pide huella ni rostro |

## Otros ajustes del manifest

- `android:allowBackup="false"` (`android.allowBackup` en `app.json`): los datos de la app no entran en las
  copias de seguridad del teléfono ni se pueden extraer con `adb backup`.
- `android:debuggable` no aparece en el build de release.
