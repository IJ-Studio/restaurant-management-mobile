import { webColor as w, webVeloDialogo } from './webTokens';

/** Mezcla `hex` al `p` sobre `base` (sRGB). Equivale a los fondos suaves `color-mix(…12%, superficie)` de la web. */
function mix(hex: string, base: string, p: number): string {
  const c = (h: string, i: number) => parseInt(h.slice(1 + 2 * i, 3 + 2 * i), 16);
  const out = [0, 1, 2].map((i) => Math.round(c(hex, i) * p + c(base, i) * (1 - p)));
  return `#${out.map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}
const rgba = (hex: string, a: number) =>
  `rgba(${[0, 1, 2].map((i) => parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16)).join(', ')}, ${a})`;

/**
 * Paleta de El Quijote = tema claro de la web (Fase 6). Los valores salen de `webTokens.ts`, generado
 * desde `styles/tokens.css` de la web; aquí solo se nombran con las claves que usan las pantallas.
 * Contrastes del tema claro de la web: acento sobre superficie 5.9:1, texto tenue 5.9:1 (AA).
 */
export const colors = {
  /** Acento de marca (oro viejo); el texto encima va en `textOnBrand`. */
  brand: w.acento,
  /** Acento intenso para texto chico sobre fondos claros. */
  brandStrong: w.acentoIntenso,
  /** Fondo tenue de marca (badges, letreros). */
  brandSoft: w.superficieCafe,
  /** Final del degradado de marca (blanco encima: 16:1). */
  brandDeep: w.textoPrincipal,
  /** Texto secundario sobre el degradado de marca (blanco al 85 %, pasa AA en todo el degradado). */
  textOnBrandMuted: 'rgba(255, 255, 255, 0.85)',
  /** Trazos decorativos sobre el degradado (no llevan información). */
  onBrandDecor: 'rgba(255, 255, 255, 0.08)',
  /** Fondo de un elemento sobre el degradado (avatar, chips). */
  onBrandSurface: 'rgba(255, 255, 255, 0.16)',
  /** Botón secundario y enlaces. */
  secondary: w.textoSecundario,

  /** Fondo de pantalla. */
  background: w.fondo,
  /** Tarjetas, inputs y pantallas de formulario. */
  surface: w.superficie,
  /** Fondo de segundo nivel: filas presionadas, chips sin seleccionar. */
  elevated: w.superficieCafe,
  /** Rellenos neutros: imagen sin foto, esqueletos de carga. */
  subtle: w.bordeSutil,

  text: w.textoPrincipal,
  textSecondary: w.textoSecundario,
  /** Placeholders y elementos deshabilitados. */
  textMuted: w.textoTenue,
  textOnBrand: w.textoSobreAcento,

  border: w.bordeSutil,
  borderStrong: w.bordeControl,

  success: w.exito,
  successSoft: mix(w.exito, w.superficie, 0.12),
  warning: w.aviso,
  warningSoft: mix(w.aviso, w.superficie, 0.12),
  danger: w.error,
  dangerSoft: mix(w.error, w.superficie, 0.12),
  info: w.info,
  infoSoft: mix(w.info, w.superficie, 0.12),

  /** Anillo de enfoque de los inputs (foco de la web al 25 %). */
  focusRing: rgba(w.foco, 0.25),
  /** Velo detrás de un diálogo modal. */
  overlay: webVeloDialogo,
} as const;

export type ColorToken = keyof typeof colors;
