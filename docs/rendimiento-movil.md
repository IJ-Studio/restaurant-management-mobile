# Rendimiento de la app (Fase 8)

## Qué mide el CI en cada PR (`performance-tests`)

Compara la rama contra la rama destino en el mismo runner (no hay línea base guardada: se mide
`develop` y la rama en cada ejecución, así que no hay archivo de línea base que actualizar).

| Medida | Herramienta | Umbral |
|---|---|---|
| Tiempo de render (percentil 10) de Login, Menú, Pedido de mesa y Reservaciones | Reassure (`src/__perf__`) | ≤ +10 % o < 1 ms |
| Número de renders | Reassure | sin aumento |
| Bundle JavaScript (Hermes) | `scripts/perf/bundle-size.js` sobre `expo export` | ≤ +5 % |

### Antes y después (13-nov, `develop` → pila hasta #470)

| Medida | `develop` | Rama | Cambio |
|---|---|---|---|
| Login: render inicial | 2.3 ms | 2.1 ms | −5.7 % |
| Menú: carga y búsqueda | 9.0 ms | 8.8 ms | −1.2 % |
| Pedido de mesa | 20.8 ms | 20.5 ms | −1.4 % |
| Reservaciones activas | 6.6 ms | 6.8 ms | +2.9 % (dentro del umbral) |
| Bundle JS (Hermes) | 4 526.4 KB | 4 698.0 KB | +3.8 % |

El bundle crece por Stripe, pinning, Personal y nómina. El SDK de Stripe se importa por rutas internas
(B-015) para no traer su índice completo: sin eso el aumento era +5.7 % y no pasaba. Los umbrales no se
tocaron.

## En el teléfono (Tanda): arranque, memoria y fotogramas

Con la app instalada (Release) y la sesión iniciada, por USB:

```bash
APP_ID=com.ijstudio.restaurantmanagement scripts/perf/medir-dispositivo.sh 5
```

Deja `reports/perf-dispositivo.json` con el arranque en frío (`am start -S -W`, mediana de 5), la
memoria PSS tras 10 s y los fotogramas lentos al desplazar la lista (`dumpsys gfxinfo`). Solo toca el
paquete de la app.

| Medida (Pixel 10a, Release) | Resultado | Meta |
|---|---|---|
| Arranque en frío (mediana) | ⏳ Tanda | < 2 000 ms |
| Memoria PSS | ⏳ Tanda | < 250 MB |
| Fotogramas lentos al desplazar | ⏳ Tanda | < 10 % |

## API

p50/p95 con k6 y recomendaciones en `docs/rendimiento.md` del repo del API (nominal: p95 GET 28.7 ms,
POST 202.6 ms; estrés hasta 220 usuarios: p95 862 ms).
