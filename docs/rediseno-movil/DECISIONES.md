# Decisiones del pulido de UI móvil

Rama `feature/pulido-ui-movil` · 2026-11-20. Orden de autoridad: especificación móvil + DESIGN.md →
`ui-mobile.html` → excepciones del responsable. Aquí queda lo que no se aplicó tal cual y por qué.

## Excepciones decididas por el responsable

| # | Especificación | Aplicado |
|---|---|---|
| E-1 | Tema oscuro por defecto | **Claro por defecto** (fondo `#F4EEE3`, superficie `#FBF8F2`, café `#EBE1D0`, acento `#835E25`, texto sobre acento `#FBF8F2`). El oscuro queda como `darkPalette` en `theme/colors.ts` con los valores de la especificación. |
| E-2 | Renombrar «Reservaciones» a «Reservas» | «Reservas» no existía: se aplica **solo como texto visible de la pestaña**. Ruta, título de la pantalla y nombre accesible siguen siendo «Reservaciones». |

## Diferencias con las rutas y fuentes indicadas

- **`src/presentation/` no existe.** La capa vive en `src/shared/presentation/` (tema y primitivas),
  `src/features/*/presentation/` (pantallas) y `src/core/navigation/` (tema de cabeceras y pestañas).
- **La especificación es `ESPECIFICACION-MOVIL.txt`**, no `.md`.
- **El repo móvil no tiene `DESIGN.md`.** Se usó en solo lectura el de `restaurant-management-web`
  (mismo sistema «El Quijote — Etiqueta de la casa»). No se copió al repo móvil.

## Puntos de la especificación no aplicados o adaptados

| Punto | Motivo | Qué se hizo |
|---|---|---|
| Íconos Lucide | No están instalados y no se agregan librerías | Ionicons equivalentes (`chevron-forward`, `alert-circle-outline`…), mismos tamaños |
| Antetítulos nuevos («PANEL OPERATIVO», «OPERACIÓN · SALA», «ACCESO OPERATIVO») | Serían textos nuevos; además `impeccable` prohíbe antetítulos decorativos | La etiqueta y el filete se aplican donde ya había antetítulo (fecha del Dashboard, mesa en Cobrar, «Corte de caja»); el filete doble abre títulos y secciones sin texto nuevo |
| Eliminar subtítulos largos en `ScreenHeader` | Quitaría textos funcionales | Se conservan |
| Códigos de zona `Z-01`, `Z-02` en `FloorMap` | No vienen de la API: serían datos inventados | Solo «ÁREA · N MESAS», que sí sale de la API |
| Metadatos de la reservación como pares rótulo/valor | El resumen llega armado por `reservationSummary` (lógica) | Se conserva el resumen; sello de fecha y pie de tarjeta sí aplicados |
| `StatusBadge` de estado en la tarjeta de reservación | El estado ya va en el resumen; duplicarlo cambiaría lo que leen pruebas y lectores | No se añadió |
| Pie de tarjeta en `superficieElevada` | En claro es `#FFFFFF` puro (prohibido) | Pie en `fondo` con filete superior |
| Filete inferior de 1 px en cabeceras de stack | El encabezado nativo no admite borde | `headerShadowVisible: false`; se separa por el escalón superficie/fondo. En pestañas sin stack sí lleva borde |
| `StatCard` con estado presionado | La tarjeta no es interactiva | Sin estado presionado (no se inventa interacción) |
| Transiciones de 150–220 ms | No hay Reanimated; animar con `Animated` en cada control añade costo y riesgo para Maestro | Estados `pressed` instantáneos (cambio de relleno/filete y desplazamiento de 1 px). Nada se anima, así que reduce-motion se respeta por construcción |
| Fraunces 600/700 | DESIGN.md pide 400 (títulos) y 500 (cifras) | `appFonts` carga Fraunces 400 y 500 en lugar de 600 y 700 (mismo paquete, misma cantidad de archivos) |

## Decisiones propias

- **Etiqueta de campo que enfoca el campo.** Al subir la etiqueta encima de la caja, tocarla enfoca el
  `TextInput` (como `<label for>`). Así `tapOn: "Correo"` de Maestro sigue escribiendo en la caja
  aunque elija el texto de la etiqueta.
- **Pestaña «Reservas» accesible como «Reservaciones».** `tabBarAccessibilityLabel` repite el formato de
  React Navigation en iOS (`Reservaciones, tab, N of M`) y en Android es «Reservaciones». Así no cambian
  los helpers de prueba (`tab('Reservaciones')`) ni el flujo `s2-hu04-reservation.yaml`.
- **Filete superior de la pestaña activa** con un `TabBarButton` propio sobre `Pressable`, que pasa
  intactas las props de accesibilidad de React Navigation.
- **Un solo relleno de acento por pantalla** (DESIGN.md): mesas ocupadas, tipos de incidencia y chips
  seleccionados pasan a tinte al 12 % + filete de acento; el relleno sólido queda para el botón primario.
- **`ghost` como enlace en tipo de oración.** Las versalitas espaciadas cortaban etiquetas largas
  («Leer el aviso de privacidad completo»). Todas las etiquetas de botón admiten 2 líneas en vez de «…».
- **Variante `secondary` de `Button`**: tonal café con filete de control (DESIGN.md solo define
  primario y secundario; `outline` toma el «secundario» de la especificación).
- **Sello de confirmación** del recibo de cobro y **sello de la casa** del perfil: únicos círculos
  fuera de insignias y mesas, porque la especificación pide el sello circular.
- **Desglose de nómina** sin `monospace`: cifras tabulares de DM Sans (el sistema no usa monoespaciada).
- **Lint local.** `npm run lint` falla en esta máquina por `.claude/skills` y `.agents/skills`
  (archivos locales de las skills, fuera de git, inexistentes en CI). Con esas dos rutas excluidas por
  línea de comandos pasa sin errores ni advertencias. No se tocó `eslint.config.js`.
- **`expo-linear-gradient`** queda sin usos en el código, pero sigue en `package.json`: quitarlo es
  tocar dependencias, fuera del alcance.
