# Ofuscación del release (R8/ProGuard) y reporte de descompilación

Evidencia de que el paquete de release sale optimizado, reducido y ofuscado, y de lo que ve quien lo
descompila. Medido el 13 de noviembre de 2026 sobre un build local de release (`arm64-v8a`).

## Configuración

`android/` no se versiona: lo genera `expo prebuild`. La configuración vive en `app.json`, en el plugin
`expo-build-properties`, y Gradle la recibe así:

| `app.json` (`expo-build-properties` → `android`) | Efecto en `android/app/build.gradle` (release) |
|---|---|
| `enableMinifyInReleaseBuilds: true` | `minifyEnabled true` con `proguard-android-optimize.txt` (R8) |
| `enableShrinkResourcesInReleaseBuilds: true` | `shrinkResources true` |
| `extraProguardRules` | Se escriben en `android/app/proguard-rules.pro` |

Reglas propias de ProGuard:

```proguard
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
```

- La primera conserva los números de línea para poder traducir los errores de producción con el
  `mapping.txt` del build.
- La segunda cambia el nombre real de cada archivo por `SourceFile`, para que el paquete no lo revele.

No hay reglas `-keep` propias: las que necesitan React Native, Expo y Sentry (clases que se llaman por
reflexión o desde código nativo) vienen dentro de cada librería. Añadir más dejaría código sin ofuscar.

## Cómo se reproduce

```bash
APP_ANDROID_PACKAGE=com.ijstudio.restaurantmanagement npx expo prebuild --platform android --clean
cd android
SENTRY_DISABLE_AUTO_UPLOAD=true ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
jadx --no-res -d salida app/build/outputs/apk/release/app-release.apk
```

`APP_ANDROID_PACKAGE` solo se usa en builds locales de prueba (ver `app.config.js`): cambia el
identificador para que la app conviva con la instalada desde Google Play. Los builds de EAS no la definen.

## Resultado de R8 (`mapping.txt` y `usage.txt` del build)

| Métrica | Valor |
|---|---|
| Tarea de Gradle | `:app:minifyReleaseWithR8` y `:app:optimizeReleaseResources` |
| Clases que quedan en el APK | 7 797 |
| Clases renombradas | 6 514 (83 %) |
| Métodos y campos renombrados | 467 239 |
| Clases eliminadas por no usarse | 11 311 |
| Tamaño del APK (`arm64-v8a`) | 30,5 MB |

## Qué ve quien descompila (jadx 1.5.6)

| Revisión | Resultado |
|---|---|
| Archivos Java recuperados | 6 525 |
| Con nombre de 1 a 3 letras (ofuscado) | 5 553 (85 %) |
| Paquete de la app | Solo `MainActivity`, `MainApplication` y `R`: el manifest los nombra y no se pueden renombrar |
| Lógica de la app (pantallas, casos de uso, cliente HTTP) | No está en Java: va en `assets/index.android.bundle` como **bytecode de Hermes** (versión 99, 3,8 MB), no como JavaScript legible |
| Secretos en el bundle (`sk_live_`, `sk_test_`, `whsec_`, `service_role`, llaves privadas) | 0 coincidencias |
| `android:debuggable` | Ausente (falso) |
| `android:allowBackup` | `false` |

Ejemplo de una clase tal como la devuelve jadx, sin nombres con significado:

```java
package defpackage;

public final class as0 implements tp {
    public long i;
    public boolean j;
    public final Object k;
    public Object l;
    public Object m;
    public final Object n;

    public as0() {
        this.i = -1L;
        this.n = new mp3(this);
        this.k = new ArrayList();
    }
}
```

## Qué sigue legible y por qué no es un riesgo

- **Nombres de clases de React Native y Expo** (`com.facebook.react…`, `expo.modules…`): el código nativo
  los busca por nombre, así que sus propias reglas los conservan. Son código abierto.
- **Textos y URL públicas**: las variables `EXPO_PUBLIC_*` viajan dentro del bundle por diseño. Por eso
  ninguna contiene un secreto; las llaves privadas viven solo en el servidor.

La ofuscación dificulta el análisis, pero no sustituye a los demás controles: sesión en almacenamiento
cifrado, HTTPS obligatorio y validación de permisos en el API.

## Depuración de errores de producción

- **Errores de JavaScript** (casi todos los de la app): los workflows de publicación suben los source maps
  a Sentry, que muestra el archivo y la línea originales.
- **Errores nativos**: cada build genera su `mapping.txt` en
  `android/app/build/outputs/mapping/release/`. El AAB lo lleva dentro, así que Play Console traduce sola
  los nombres ofuscados; para un APK instalado a mano hay que guardar el `mapping.txt` de ese build.
