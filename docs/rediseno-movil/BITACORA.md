# Bitácora — pulido de UI móvil

Rama `feature/pulido-ui-movil` (desde `develop` en 00abc31) · 2026-11-20.
Sistema: «El Quijote — Etiqueta de la casa», tema claro por defecto. Inventario en
[INVENTARIO.md](INVENTARIO.md); excepciones y motivos en [DECISIONES.md](DECISIONES.md).

## Qué se cambió

### Tema (`src/shared/presentation/theme/`)

- Radios estrictos: control 2, tarjeta 4, diálogo 6, pastilla 999 (solo insignias, mesas/sillas
  redondas y los dos sellos). Se retiró `radius.xl`.
- Sin sombras: se retiraron `shadows`, `gradients` y los tokens «sobre degradado» con blancos puros
  (`onBrandDecor`, `onBrandSurface`, `textOnBrandMuted`, `brandDeep`, `focusRing`) y `elevated`.
- Controles a 44 px (`sizes.control`); presionado con desplazamiento de 1 px (`pressOffset`).
- Tipografía: Fraunces 400/500; versalitas de etiqueta (DM Sans 600, 12, 0.16em); insignia a 0.12em;
  `tabular-nums` en toda la escala y `lining-nums` en Fraunces; nuevos `label`, `stat`.
- `brandTint` (acento al 12 %) y `darkPalette` (tema oscuro alternativo, como datos).

### Primitivas (`src/shared/presentation/components/`)

Button, TextField (y PasswordField por herencia), Card, StatusBadge, Chip (+ variante `tab`),
ScreenHeader, SectionTitle, HeroCard, StatCard, CalculationView, HeaderButton, ListItem, FloorMap,
EmptyState, ErrorState, Notice, Charts. Nuevas: `DoubleRule` (filete doble) y `TabBarButton`.

### Navegación (`src/core/navigation/`)

Pestaña activa con filete superior de 2 px; «Reservas» visible; ícono de Perfil sin círculo relleno;
cabeceras en Fraunces 400 sin sombra; barra con `elevation: 0` y filete de 1 px.

### Pantallas con cambios propios

| Pantalla | Cambio |
|---|---|
| Login | Banda de marca café sólida con filete doble, sin degradado ni círculo; formulario sobre el fondo; barra de estado oscura |
| Dashboard | 7 accesos rápidos como `HeaderButton` en rejilla fluida (2-3-2 en 390 px); «Cobrado hoy» con divisor de control |
| Perfil | Sello de la casa (80 px, doble filete, monograma Fraunces); rol en `StatusBadge`; datos como contraetiqueta |
| Permiso de avisos (modal) | Filete de control y filete doble |
| Reservaciones | Pestañas con filete doble; sello de fecha; «Cambiar estado» como botón secundario en el pie de la tarjeta |
| Nueva reservación | Stepper de radio 2; rótulos de campo; selector de fecha con filete de control |
| Estado de reservación | Rótulo de campo del sistema |
| Pedidos (tarjeta) | Sin sombra; atrasado con filete y tinte de error; aviso de cocina con filete |
| Botón de pedido en curso | Control de radio 2 y 44 px |
| Tomar pedido | Steppers de radio 2; «Agregar nota» con área de 44 |
| Detalle de pedido | Cantidad en caja de control con filete |
| Cobrar | Steppers de radio 2; cajas de cambio con filete; sello de confirmación en contorno |
| Caja | Diferencias con filete y tinte; ícono en caja de control |
| Nómina | Desglose de radio 2 con cifras tabulares |
| Reportar incidencia / Registrar merma | Opciones como controles de radio 2; selección en tinte + filete |
| Menú | Búsqueda como campo de 44 con radio 2 |
| Aviso de privacidad | Abre con filete doble |

### Pantallas que heredan el sistema sin cambios propios

Empleados de la nómina, Mesas, Personal, Facturas, Promociones, Existencias, Detalle de platillo
(+ controles admin), Reportes de cocina, Pedidos (lista), Cobros (lista), Privacidad, Eliminar cuenta,
Editar perfil, Cambiar contraseña. Todas están hechas solo con primitivas y tokens; se revisaron
contra el inventario y no tenían estilos fuera del sistema.

## Verificación

- `npm run typecheck`: sin errores.
- `npm run lint`: sin errores ni advertencias excluyendo `.claude/**` y `.agents/**` (ver DECISIONES).
- Auditoría `rg` final: sin `shadow*`/`boxShadow`, sin radios fuera de {2, 4, 6, 999}, sin `fontSize` < 12,
  sin `LinearGradient`, sin hexadecimales ni `rgba` fuera del tema, sin blancos puros en uso. Quedan
  `elevation: 0` y `headerShadowVisible: false`, que justamente quitan sombras.
- Pruebas existentes, solo las de lo tocado (no el Jest completo, sin modificarlas): navegación y
  componentes compartidos (32) y presentación de reservaciones, auth, admin y privacidad (69): pasan.
- No se corrieron Maestro, builds de EAS ni capturas (no hay dispositivo).
- La operación de la carta en producción sigue pausada: no se tocó.

## Pendiente

- Revisión visual en dispositivo (lista abajo).
- Selector de tema claro/oscuro: `darkPalette` está lista, pero cablearla es lógica (contexto/hook).
- Quitar `expo-linear-gradient` de `package.json` si ya no se usa en otra rama.
- Que el lint ignore `.claude/` y `.agents/` en `eslint.config.js`, si se quiere correr `npm run lint`
  tal cual en máquinas con skills instaladas.

## Qué revisar en el Pixel

1. **Login:** logo teñido en texto principal sobre café claro; barra de estado oscura legible.
2. **Pestañas:** «Reservas» completa; filete superior de 2 px en la activa; TalkBack dice «Reservaciones».
3. **Campos:** etiqueta encima; tocar la etiqueta enfoca la caja; el anillo de foco (`outline`) se ve
   en Android sin mover el formulario.
4. **Botones:** etiquetas en versalitas sin cortarse (las largas pasan a 2 líneas); desplazamiento de 1 px al presionar.
5. **Dashboard:** accesos en filas 2-3-2; «Ver cálculo» legible y fácil de tocar; mesas con su tinte por estado.
6. **Reservaciones:** pestañas con filete doble y el botón «Cambiar estado» dentro de la tarjeta.
7. **Perfil:** sello circular con doble filete y monograma centrado.
8. **Cifras:** que Fraunces y DM Sans muestren cifras tabulares (montos alineados en Cobrar, Caja y Nómina).
9. Correr el flujo Maestro `s2-hu04-reservation.yaml` y el login (`subflows/login.yaml`).

## Sesión 2 · 2026-11-20 · Release en el Pixel 10a, regresiones y rendimiento

Release local de la rama (R8, Stripe #476 y pinning #481), API local con base local por túnel rápido de
`cloudflared` (nunca la base de producción). Pantalla del teléfono encendida por USB solo durante la
sesión (se restauró el ajuste).

### Regresiones del pulido corregidas

| Commit | Qué fallaba | Corrección |
|---|---|---|
| `8d4db74` fix(ui) | Login: con la etiqueta encima de cada campo, el teclado tapaba la caja de Contraseña (Android edge-to-edge ya no redimensiona la ventana). Al tocarla se pulsaba una tecla. Rompía 8 de 10 flujos de Maestro | Banda de marca, logo (220 → 180) y márgenes ~57 dp más compactos |
| `aa4ec8f` fix(test) | `s2-hu04-reservation`: el centro de la pantalla, donde desliza `scrollUntilVisible`, cae ahora sobre la caja de Correo. Un arrastre que empieza sobre una caja de texto no mueve el formulario (también en `develop`) | El segundo desplazamiento empieza en el margen izquierdo |
| `a198b94` fix(ui) | Dashboard: ~540 px vacíos bajo los accesos rápidos (Yoga medía cada `HeaderButton` a todo lo ancho por el `flexGrow` de la etiqueta). En Pedidos, «Reportes» ocupaba toda la cabecera y tapaba el título | Chevron con `marginLeft: 'auto'`; la etiqueta ya no crece |

### Resultados

- **Maestro (Release, Pixel 10a): 10 de 10** en la corrida final (`s3-hu05-cuenta-dividida` incluido).
  - `s3-hu06-realtime` es intermitente por el túnel: el SSE no pasa (B-031) y la app cae al refresco
    de 30 s, más largo que la espera de 10 s del flujo. También falla en `develop`; no es del pulido.
  - `arco-privacy` consume `baja@prueba.local`: relanzar `_entrada/semilla-local.sql` antes de cada
    corrida.
  - Hay que pasar las variables con `-e` (`-e API_URL=… -e PLATILLO_ID=154`), no por el entorno del
    shell.
- **Jest completo en serie** (`--runInBand`): 726 pasan, 8 omitidas, 0 fallan (113 archivos, 4
  omitidos). Sin `--forceExit` el proceso no termina al acabar: queda un handle abierto. No es nuevo.
- **typecheck** y **lint** (excluyendo `.claude/` y `.agents/`): sin errores.

### Capturas (`capturas/`, 720 px, JPG)

| Punto a revisar | Resultado |
|---|---|
| «Reservas» completo y pestaña activa | ✅ texto completo; filete superior de 2 px en la activa (05, 09) |
| Anillo de foco en Android | ✅ visible y sin mover el formulario (02, 10) |
| Botones con texto largo | ✅ «Empezar a preparar», «Cobrar con tarjeta en la app» y «Cambiar estado» en una línea, sin cortes (08, 09, 14) |
| Alineación de montos | ✅ cifras tabulares en Cobrar, Caja y Cobros (12, 13, 15, 16) |
| Sello del perfil | ✅ centrado, doble filete y monograma (11) |
| Login con teclado | ✅ tras `8d4db74`, Contraseña queda sobre el teclado (02) |
| Dashboard | ✅ tras `a198b94`, sin hueco (03, 04) |

Hallazgos visuales que no son regresión (quedan anotados, sin tocar):

- **«Ver cálculo» repetido:** dos o tres seguidos en las tarjetas del Dashboard y de Caja. Ya pasaba
  en `develop`; el pulido solo los subió de 32 a 44 px. El nombre accesible sí los distingue.
- **Botón primario deshabilitado** («Cobrar $95.00», «Cerrar caja»): el texto apenas contrasta.
- **Arrastre sobre una caja de texto:** en formularios largos (Nueva reservación) no desplaza la
  pantalla. Ya pasaba en `develop`.
- **Pestañas en Android:** el nombre accesible empieza con «, » (por ejemplo «, Dashboard»).
  - Android lo arma con los hijos del botón: el glifo del ícono más la etiqueta.
  - Solo «Reservaciones» tiene un nombre fijo (`tabLabelOptions`).
  - Falta confirmarlo con TalkBack y compararlo con `develop`.

### Rendimiento

Detalle en [RENDIMIENTO.md](RENDIMIENTO.md):

- El Menú se traba por las fotos a tamaño original (85 % de fotogramas lentos con fotos frente a
  0,34 % sin ellas).
- El pulido no cambió las cifras frente a `develop`.

### AAB para Play

Comprobaciones, decisiones pendientes y comandos en [AAB-PLAY.md](AAB-PLAY.md). Nada se generó ni
se subió.

### Estado del entorno al cerrar

- Detenidos el túnel, la API local y la base local.
- La base local quedó sin fotos, como estaba. Se agregaron pedidos de prueba (uno por mesa) para la
  línea base de Pedidos.
- `.env.local` apunta al túnel ya cerrado.
- En el teléfono queda instalado el Release de la rama (`a198b94`) con la sesión de cajero.
