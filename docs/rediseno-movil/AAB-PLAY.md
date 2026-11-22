# Preparar el AAB 1.1.0 para Play (sin generarlo ni subirlo)

Revisado el 2026-11-20 sobre `feature/pulido-ui-movil`. Nada de esto se ejecutó: el build, la subida
y los cambios en Play Console los hace Irving.

## 1. Comprobaciones

| Punto | Estado | Evidencia |
|---|---|---|
| versionName | ✅ 1.1.0 | `app.json` (`expo.version`), desde #483 |
| versionCode | ✅ saldrá el **10** | `eas build:version:get -p android --profile store` → `versionCode - 9` (remoto). Con `appVersionSource: remote` y `autoIncrement: true` (en `production`, lo hereda `store`), el siguiente build será el 10, mayor que el 9 que está en Play (1.0.0 del 11-nov) |
| Perfil para Play | ✅ `store` | `eas.json`: `store` extiende `production` con `buildType: app-bundle`. `production` da APK |
| Entorno de EAS | ✅ `production` | `EXPO_PUBLIC_API_URL` es el API de Render (según `_entrada/play/ACTUALIZACION-PLAY.md`); `EXPO_PUBLIC_USE_RN_FETCH=1` en todos los perfiles |
| #476 (Release con Stripe) | ✅ en la rama | Cabeza del PR `e7e4422` es ancestro de la rama; `plugins/with-lint-release-off.js` y `-dontwarn com.stripe.android.pushProvisioning.**` en `app.json` |
| #481 (pinning efectivo) | ✅ en la rama | Cabeza del PR `c2d0301` es ancestro de la rama; `EXPO_PUBLIC_USE_RN_FETCH=1` en `eas.json` |
| `develop` ancestro de la rama (DM-37) | ✅ | `origin/develop` = `00abc31` |
| Build Release local de la rama | ✅ compila e instala | Pixel 10a, 2026-11-20 (ver `BITACORA.md`) |

## 2. Lo que debes decidir antes de generar el AAB

| # | Decisión | ¿Resuelta en la documentación? | Qué hacer |
|---|---|---|---|
| D1 | **Sentry:** `SENTRY_DISABLE_AUTO_UPLOAD=true` en el entorno `production` de EAS deja las trazas ofuscadas (sin mapas de R8 ni de Hermes) | ❌ No (pendiente desde B-037 y el checkpoint 4f) | Decidir si quitarla en expo.dev → proyecto → Environment variables → `production` antes del build. Con ella, Sentry recibe errores ilegibles |
| D2 | **Firma:** SHA-1 de la llave de subida de EAS `3D:5E:4A:47:B7:32:25:D7:16:9A:2F:4F:FF:F5:74:37:15:60:0C:01` contra Play Console → Configuración → Integridad de la app → Firma de apps → *Certificado de la clave de subida* | ❌ No (pendiente desde B-037 y el checkpoint 4e) | Comparar a mano. Si no coincide, Play rechaza el AAB: no generar hasta confirmarlo |
| D3 | **Seguridad de los datos en Play:** agregar «Información de pago del usuario» (Stripe), marcar «Historial de compras» y confirmar «Registros de fallos» y «Diagnóstico» (Sentry) | ❌ No (pendiente; detalle en `_entrada/play/ACTUALIZACION-PLAY.md` §6) | Play Console → Contenido de la app → Seguridad de los datos. Puede hacerse antes de enviar la versión a revisión |
| D4 | Política de privacidad y `/eliminar-cuenta` publicadas en la web de producción | ⚠️ Parcial (la web se despliega cuando lo indiques) | Comprobar que ambas URL responden antes de enviar a revisión |
| D5 | Rendimiento del Menú (ver `RENDIMIENTO.md`) | — | Decidir si la 1.1.0 sale así o espera el PR del Menú. El problema ya existe en la 1.0.0 |

## 3. Comandos, en orden

### a) Abrir el PR de la rama hacia `develop`

```bash
cd restaurant-management-mobile
git fetch origin
git merge-base --is-ancestor origin/develop origin/feature/pulido-ui-movil && echo "develop es ancestro: OK"
gh pr create --base develop --head feature/pulido-ui-movil \
  --title "style(ui): pulido de UI móvil «Etiqueta de la casa»" \
  --body-file docs/rediseno-movil/BITACORA.md
```

### b) Después de fusionarlo: actualizar `develop` y generar el AAB

```bash
git switch develop
git pull --ff-only
git log -1 --oneline                 # debe ser el merge del PR del pulido
eas build:version:get -p android --profile store   # debe decir 9 (el build pondrá 10)
eas build -p android --profile store
```

Al terminar, descarga el `.aab` desde el enlace que imprime EAS (o expo.dev → Builds).

### c) Subirlo a mano a la pista de pruebas cerradas

En Play Console, app `quijote.mobile`:

1. **Probar y lanzar → Pruebas → Pruebas cerradas** → la pista que ya usan tus testers →
   **Crear versión** (no «Crear pista»).
2. **App bundles:** subir el `.aab`. Play debe mostrar versionCode **10** y versión **1.1.0**. Si dice
   que la clave de firma no coincide, detente (D2).
3. **Nombre de la versión:** dejar el que propone Play («10 (1.1.0)»).
4. **Notas de la versión:** pegar el bloque `<es-419>…</es-419>` de
   `_entrada/play/ACTUALIZACION-PLAY.md` §4 (440 caracteres).
5. **Siguiente → Revisar la versión:** atender errores. Las advertencias de símbolos de depuración
   (código nativo) no bloquean.
6. **Guardar → Enviar cambios a revisión** (Resumen de la publicación).

**No tocar:**

- La pestaña **Testers**: ni la lista de correos ni el grupo de Google.
- **Países y regiones** de la pista.
- **No pausar ni detener la pista**, y no crear una pista cerrada nueva. Eso reinicia los 14 días
  con 12 testers.
- No promover a Producción ni a otra pista.
- No cambiar el **porcentaje de lanzamiento** ni las **Pruebas internas**.
