/**
 * Paleta de El Quijote, tomada de la web (styles/globals.css y los tokens del panel).
 * Contraste medido sobre `surface` (#fff); AA pide 4.5:1 en texto normal y 3:1 en texto grande.
 */
export const colors = {
  /** Naranja de marca. Blanco encima da 3.5:1: solo con texto grande (≥ 18 px en negrita) o íconos. */
  brand: '#e85d04',
  /** Naranja oscuro para texto chico sobre fondos claros (5.4:1 sobre blanco, 4.8:1 sobre brandSoft). */
  brandStrong: '#b54803',
  /** Fondo naranja tenue (brand al 10 %), como los badges y el letrero "Abierto ahora" de la web. */
  brandSoft: '#fdefe6',
  /** Naranja profundo para el final del degradado de marca (blanco encima: 9.4:1). */
  brandDeep: '#7c2d12',
  /** Texto secundario sobre el degradado de marca (blanco al 85 %, pasa AA en todo el degradado). */
  textOnBrandMuted: 'rgba(255, 255, 255, 0.85)',
  /** Trazos decorativos sobre el degradado (no llevan información). */
  onBrandDecor: 'rgba(255, 255, 255, 0.08)',
  /** Fondo de un elemento sobre el degradado (avatar, chips). */
  onBrandSurface: 'rgba(255, 255, 255, 0.16)',
  /** Gris pizarra del botón secundario y los enlaces de la web. */
  secondary: '#232f38',

  /** Fondo de pantalla (crema). */
  background: '#faf9f7',
  /** Tarjetas, inputs y pantallas de formulario. */
  surface: '#ffffff',
  /** Fondo de segundo nivel: filas presionadas, chips sin seleccionar. */
  elevated: '#f5f3ef',
  /** Rellenos neutros: imagen sin foto, esqueletos de carga. */
  subtle: '#ede9e3',

  text: '#1a1208',
  /** Texto secundario (6.3:1). */
  textSecondary: '#6b5e4e',
  /** Solo placeholders y elementos deshabilitados (2.8:1, no apto para texto que se deba leer). */
  textMuted: '#a89880',
  textOnBrand: '#ffffff',

  border: '#e8e1d8',
  borderStrong: '#d4c8bc',

  // Estados: misma familia que la web (ok/warn/danger/info) en el tono 700, que pasa AA sobre blanco
  // y sobre su fondo suave; los fondos son los de las alertas de la web (green/yellow/red-100).
  success: '#047857',
  successSoft: '#d1fae5',
  warning: '#b45309',
  warningSoft: '#fef3c7',
  danger: '#b91c1c',
  dangerSoft: '#fee2e2',
  info: '#1d4ed8',
  infoSoft: '#dbeafe',

  /** Anillo de enfoque de los inputs (brand al 25 %), como `focus:ring-brand/50` de la web. */
  focusRing: 'rgba(232, 93, 4, 0.25)',
} as const;

export type ColorToken = keyof typeof colors;
