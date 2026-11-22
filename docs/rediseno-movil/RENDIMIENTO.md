# Rendimiento de la pantalla del Menú

Rama `feature/pulido-ui-movil` · 2026-11-20 · Pixel 10a (Android 17, 1080 × 2424, 420 dpi) por USB.
Solo diagnóstico: **no se arregló nada del Menú** (va en su propio PR).

## Resumen

El Menú se traba por las **fotos de los platillos**: se piden a tamaño original (1200 × 1600 la
mayoría, hasta 8 MB) para una miniatura de 64 dp (168 px en este teléfono). Con fotos, el 85 % de los
fotogramas son lentos y la app ocupa 1,4 GB. Con los mismos datos sin fotos, el 0,34 %.
**El pulido no cambió nada medible**: `develop` da las mismas cifras.

| Cifra clave (Menú con fotos, build de la rama) | Valor |
|---|---|
| Fotogramas lentos al desplazar | **85,0 %** (1 231 de 1 449) |
| Percentiles 50 / 90 / 95 / 99 del fotograma | **77 / 89 / 97 / 150 ms** (meta: 16 ms) |
| Memoria PSS tras desplazar | **1,43 GB** (293 MB sin fotos) |
| Texturas subidas a la GPU por fotograma | **41** (4,5 s de 10 s del hilo de render) |
| Peso de las fotos de la carta | **21,2 MB** (85 fotos; mediana 126 KB, máx. 8,07 MB) |

## Método

- **Build:** Release local (`assembleRelease`, arm64, R8, Stripe #476 y pinning #481 incluidos), el
  mismo procedimiento que la Tanda 1. API local (`_entrada/local.sh api`, base local, nunca la de
  producción) por un túnel rápido de `cloudflared`.
- **Datos:** la base local tiene 154 platillos y ninguna foto. Para medir como en producción, se
  copiaron a 82 platillos locales las URL públicas de las fotos de producción (leídas con
  `GET /menu`, sin escribir en producción). Respaldo en el scratchpad; al terminar se dejó la base
  local como estaba (sin fotos).
- **Desplazamiento:** `dumpsys gfxinfo <paquete> reset`; el mismo recorrido tres veces (8
  deslizamientos `input swipe 540 1900 → 540 700` de 300 ms hacia abajo y 8 hacia arriba, con 0,6 s
  entre cada uno); después `dumpsys gfxinfo` y `framestats`. Mismo guion en el Menú y en Pedidos
  (línea base, 25 pedidos).
- **Arranque:** `am start -S -W` × 5 (`TotalTime`, hasta el primer fotograma) y «tiempo hasta pantalla
  estable»: capturas en crudo en bucle hasta el último cambio de pantalla. Resolución de esta segunda
  medida: ~0,85 s por captura, así que es aproximada.
- **Abrir el Menú desde el Dashboard:** proceso nuevo (la carta no está en la caché de React Query),
  toque en la pestaña y tiempo hasta pantalla estable. Incluye el `GET /menu` por el túnel y la carga
  de fotos.
- **Traza:** `atrace` de 10 s (`gfx view hwui dalvik sched`) durante 6 deslizamientos en el Menú.
- **Antes y después:** `develop` (`00abc31`) compilado igual en un worktree aparte (sin tocar la rama),
  instalado en el mismo teléfono, sesión iniciada de cero y el mismo guion.

## Cifras

| Medida | Rama (pulido) | `develop` | Rama sin fotos |
|---|---|---|---|
| Menú: fotogramas totales | 1 449 | 1 388 | 2 929 |
| Menú: fotogramas lentos | **85,0 %** | 88,5 % | 0,34 % |
| Menú: p50 / p90 / p95 / p99 | 77 / 89 / 97 / 150 ms | 77 / 93 / 101 / 150 ms | 10 / 15 / 17 / 25 ms |
| Menú: Vsync perdidos | 1 058 | 1 079 | 0 |
| Menú: subidas de bitmap lentas | 1 231 | 1 226 | 2 |
| Menú: hilo de UI lento | 850 | 880 | 10 |
| Memoria PSS (tras desplazar el Menú) | 1 429 MB | 1 485 MB | 293 MB |
| Pedidos: fotogramas lentos | 0,12 % (3 de 2 529) | 0,12 % (3 de 2 607) | — |
| Pedidos: p50 / p90 / p95 / p99 | 6 / 8 / 9 / 12 ms | 7 / 9 / 10 / 12 ms | — |
| Arranque en frío `TotalTime` (mediana de 5) | 136 ms (128–147) | 146 ms (131–146) | — |
| Arranque hasta pantalla estable (3 tomas) | ~2,8 s (2,7 / 2,8 / 7,8) | ~4,7 s (2,9 / 4,7 / 4,7) | — |
| Abrir el Menú desde el Dashboard (3 tomas) | ~2,9 s (2,8 / 2,9 / 3,6) | ~3,0 s (2,8 / 3,0 / 3,0) | — |

Lectura: el pulido no empeoró ni mejoró el Menú (las diferencias están dentro del ruido de una sola
sesión). El arranque «estable» varía mucho entre tomas (resolución de 0,85 s y el panel del Dashboard
se actualiza al llegar los datos), así que no permite comparar. La cifra de la Tanda 1 (1,3 % de
fotogramas lentos) se midió con la base local **sin fotos**; por eso no detectó el problema.

### Traza (10 s desplazando el Menú, build de la rama)

| Hilo · tramo | Total | Detalle |
|---|---|---|
| RenderThread · `Texture upload` | 4 501 ms | 7 488 subidas en 182 fotogramas (41 por fotograma): 1200×1600 (2 437), 1600×1200 (1 055), 960×1280 (869), 1536×2048 (232)… |
| RenderThread · `DrawFrames` | 5 473 ms | 30 ms de media por fotograma, máx. 90 ms |
| GPU · espera de terminación | 3 313 ms | La GPU recibe texturas enormes en cada fotograma |
| FrescoDecodeExecutor · `decodeBitmap` | 1 537 ms | 128 decodificaciones a tamaño completo, máx. 82 ms |
| Hilo principal · `Choreographer#doFrame` | 6 169 ms | Casi todo es esperar al RenderThread (`postAndWait` 5 042 ms) |

Las mismas fotos se vuelven a subir en cada fotograma: los bitmaps a tamaño completo (7,7 MB cada uno
en ARGB) no caben en la caché de texturas de hwui y se expulsan entre sí.

## Lectura del código

| Punto | Estado | Dónde |
|---|---|---|
| Tipo de lista | `SectionList` (categorías con encabezado fijo) | `MenuScreen.tsx:40` |
| `keyExtractor` | Sí, por id | `MenuScreen.tsx:46` |
| `getItemLayout` | No (las filas varían: subtítulo de 1–2 líneas e insignia) | — |
| `initialNumToRender` / `windowSize` / `maxToRenderPerBatch` | Por omisión (10 / 21 / 10): monta ~10 pantallas arriba y abajo | — |
| `removeClippedSubviews` | No se fija. `FlatList` (Pedidos) lo activa por omisión en Android; `SectionList` no (`node_modules/react-native/Libraries/Lists/FlatList.js:162-166`) | — |
| Secciones | Se rearman con `.map` en cada render (nueva identidad → la lista re-renderiza) | `MenuScreen.tsx:41-45` |
| `renderItem` / `renderSectionHeader` | Funciones en línea; `onPress` nuevo por fila | `MenuScreen.tsx:47-67` |
| Separador | Componente en línea: nuevo tipo en cada render, se desmonta y monta | `MenuScreen.tsx:68` |
| Fila | `ListItem` sin `memo`; `accessibilityLabel` armado en cada render | `ListItem.tsx:22,39` |
| Filtro | `useMemo` sobre carta y búsqueda (bien); normaliza con NFD cada platillo por tecla | `useMenu.ts:20`, `menuFilters.ts:16-18` |
| Imagen | `Image` de React Native (Fresco), sin `resizeMethod` ni tamaño pedido; URL original | `ListItem.tsx:43`, `menuMapper.ts:34` |
| Origen de las fotos | **Supabase Storage**, no Cloudinary; sin transformaciones (`/render/image` responde 403: no están activas en el plan); `Cache-Control: max-age=3600` | API / carga desde la web |
| Placeholder | Caja café mientras carga o si no hay foto | `ListItem.tsx:45` |
| Platillos | Producción devuelve 196 (85 con foto); se pintan ~8 por pantalla y se montan hasta ~10 pantallas por lado | — |
| Trabajo por fila | 1 imagen, 2–3 `Text`, insignia opcional, chevron, `Pressable` | `ListItem.tsx` |

## Hallazgos por impacto

1. **Fotos a tamaño original en miniaturas de 168 px** (impacto: muy alto).
   - Causa: la API entrega la URL del archivo original (1200×1600, 21 MB entre las 85; una de 8 MB y
     otra de 2,5 MB en PNG). `Image` decodifica cada una a tamaño completo y hwui sube 41 texturas
     por fotograma.
   - Evidencia: 85 % de fotogramas lentos con fotos frente a 0,34 % sin ellas, 1,43 GB frente a
     293 MB, y la traza de arriba.
   - Dónde: `src/shared/presentation/components/ListItem.tsx:43`,
     `src/features/menu/data/mappers/menuMapper.ts:34` y el origen de las fotos (Supabase Storage).
   - En teléfonos de 3–4 GB, 1,4 GB de PSS lleva a pausas largas del recolector o al cierre de la app
     por memoria. Es la explicación más probable de «se traba en muchos dispositivos».
2. **Ventana de montaje por omisión** (impacto: alto, multiplica el anterior).
   - Causa: con `windowSize` 21 y sin `removeClippedSubviews`, la lista mantiene montadas (con su
     bitmap) filas de unas 10 pantallas por lado. De ahí que se suban 41 texturas por fotograma con
     solo ~8 filas visibles.
   - Dónde: `MenuScreen.tsx:40-86`.
3. **Re-renders evitables de la lista** (impacto: medio-bajo).
   - Causas:
     - Secciones nuevas en cada render (`MenuScreen.tsx:41-45`).
     - `renderItem` en línea con `ListItem` sin `memo` (`MenuScreen.tsx:57-67`, `ListItem.tsx:22`).
     - Separador en línea (`MenuScreen.tsx:68`).
   - Cada tecla de la búsqueda o cada refresco vuelve a pintar todas las filas montadas y remonta
     los separadores.
   - Evidencia: sin fotos, el Menú queda en p50 de 10 ms frente a 6 ms de Pedidos. Va dentro de
     presupuesto en el Pixel, pero no en un teléfono lento.
4. **Efecto del pulido** (impacto: nulo medido). `fontVariant` en todo el texto, el chevron de la fila
   y el filete del buscador no movieron las cifras (85,0 % frente a 88,5 %; p50 de 77 ms igual).

## Propuestas (para su propio PR)

| # | Propuesta | Efecto esperado | Esfuerzo | Riesgo |
|---|---|---|---|---|
| P1 | Miniaturas desde el origen: generar al subir una versión de ~320 px en WebP/JPEG calidad 70 (en la API o la web) y exponerla aparte (`imagenMiniaturaUrl`), con un script único para las 85 fotos actuales. Alternativa: Cloudinary con `w_320,q_auto,f_auto`, o activar las transformaciones de Supabase (plan de pago) | Ataca la causa: ~30 KB por foto en lugar de 250 KB–8 MB; decodificación y textura pequeñas | 0,5–1 día (API + web + script) | Bajo-medio: toca API y web; el detalle sigue usando la foto grande |
| P2 | En la app, mientras llega P1: `resizeMethod="resize"` (Fresco reduce al tamaño de la vista al decodificar) en la miniatura de `ListItem` | Reduce memoria y texturas aunque la descarga siga pesando | 15 min + medir | Bajo |
| P3 | `windowSize` 5–7, `initialNumToRender` ~10, `maxToRenderPerBatch` ~8 y `removeClippedSubviews` en la lista del Menú | Menos filas montadas: menos bitmaps vivos y menos memoria | 30 min + medir | Bajo-medio (probar los encabezados fijos con `removeClippedSubviews`) |
| P4 | `useMemo` para las secciones, `useCallback` para `renderItem`/encabezado, `memo` en `ListItem` y el separador fuera del render | Escribir en el buscador y refrescar dejan de repintar todo | 1 h | Bajo |
| P5 | Recomprimir en la web las dos fotos PNG pesadas (8 MB y 2,5 MB) | Quita los dos peores casos ya, sin código | 10 min | Nulo |
| P6 | Medir de nuevo con este mismo guion en un Android de gama baja (3–4 GB) antes y después | Confirmar el efecto donde se reporta el problema | 1 h | Nulo |

`expo-image` (caché en memoria y disco, `recyclingKey`, tamaño pedido) también resolvería P2, pero es
una dependencia nueva: decidirlo en el PR del Menú.

## Archivos de evidencia (no versionados)

Salidas de `gfxinfo`, `framestats`, la traza `atrace` y los guiones (`medir-lista.sh`,
`sesion-perf.sh`, `estable.py`) quedaron en el scratchpad de la sesión, no en el repo.
