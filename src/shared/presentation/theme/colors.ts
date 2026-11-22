import { webColor as w, webVeloDialogo } from './webTokens';

/** Mezcla `hex` al `p` sobre `base` (sRGB). Equivale a los fondos suaves `color-mix(…12%, superficie)` de la web. */
function mix(hex: string, base: string, p: number): string {
  const c = (h: string, i: number) => parseInt(h.slice(1 + 2 * i, 3 + 2 * i), 16);
  const out = [0, 1, 2].map((i) => Math.round(c(hex, i) * p + c(base, i) * (1 - p)));
  return `#${out.map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Paleta de El Quijote = tema claro de la web, el tema por defecto de la app. Los valores salen de
 * `webTokens.ts`, generado desde `styles/tokens.css` de la web; aquí solo se nombran con las claves
 * que usan las pantallas. Sin #000 ni #FFF puros: la superficie elevada de la web (#FFFFFF en claro)
 * no se usa; las capas suben por fondo → superficie → café.
 * Contrastes del tema claro de la web: acento sobre superficie 5.9:1, texto tenue 5.9:1 (AA).
 */
export const colors = {
  /** Acento de marca (oro viejo); el texto encima va en `textOnBrand`. */
  brand: w.acento,
  /** Acento intenso para texto chico sobre fondos claros. */
  brandStrong: w.acentoIntenso,
  /** Fondo tenue de marca (badges, letreros). */
  brandSoft: w.superficieCafe,
  /** Acento al 12 % sobre la superficie (`color-mix` de la web): insignias y selección. */
  brandTint: mix(w.acento, w.superficie, 0.12),
  /** Relleno de la mesa elegida en el plano. */
  secondary: w.textoSecundario,

  /** Fondo de pantalla. */
  background: w.fondo,
  /** Tarjetas, inputs y pantallas de formulario. */
  surface: w.superficie,
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

  /** Velo detrás de un diálogo modal. */
  overlay: webVeloDialogo,
} as const;

export type ColorToken = keyof typeof colors;

/**
 * Tema oscuro de DESIGN.md, alternativo al claro por defecto. Queda como datos con los mismos nombres
 * de `webTokens`: la app aún no tiene selector de tema y cablearlo es lógica, fuera del pulido visual.
 */
export const darkPalette = {
  fondo: '#14100C',
  superficie: '#1C1712',
  superficieElevada: '#262019',
  superficieCafe: '#2B2119',
  bordeSutil: '#2E261F',
  bordeControl: '#7D6E5A',
  textoPrincipal: '#EFE7DA',
  textoSecundario: '#BDB09C',
  textoTenue: '#978A76',
  acento: '#C9A267',
  acentoIntenso: '#DBB97F',
  textoSobreAcento: '#14100C',
  foco: '#E8C98F',
  error: '#E8846F',
  exito: '#9CC08F',
  aviso: '#D9AE5B',
  info: '#9DB4C7',
} as const satisfies Partial<Record<keyof typeof w, string>>;
