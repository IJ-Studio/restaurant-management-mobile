import type { TextStyle } from 'react-native';

/**
 * Tipografía de «Etiqueta de la casa»: Fraunces (serif) para títulos y cifras protagonistas, y DM Sans
 * para todo lo demás. Con fuentes propias cada peso es su propia familia (`fontWeight` no elige el
 * archivo), por eso los estilos usan `fontFamily`. Los nombres coinciden con las claves de `appFonts`.
 * Mínimo absoluto: 12. Nunca `uppercase` sobre Fraunces.
 */
export const fonts = {
  display: 'Fraunces_400Regular',
  displayMedium: 'Fraunces_500Medium',
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
} as const;

/** Cifras en columnas fijas para que no bailen al actualizarse; en Fraunces, además, de altura de caja. */
const tabular: TextStyle['fontVariant'] = ['tabular-nums'];
const serifFigures: TextStyle['fontVariant'] = ['lining-nums', 'tabular-nums'];

/** Versalitas espaciadas de la etiqueta (0.16em de 12 px). */
const etiqueta = {
  fontFamily: fonts.semibold,
  fontSize: 12,
  lineHeight: 16,
  letterSpacing: 1.92,
  textTransform: 'uppercase',
  fontVariant: tabular,
} as const satisfies TextStyle;

/** Escala tipográfica. */
export const typography = {
  /** Título de portada (Login). */
  display: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.3,
    fontVariant: serifFigures,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.1,
    fontVariant: serifFigures,
  },
  heading: { fontFamily: fonts.displayMedium, fontSize: 20, lineHeight: 26, fontVariant: serifFigures },
  subheading: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22, fontVariant: tabular },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, fontVariant: tabular },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 24, fontVariant: tabular },
  small: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, fontVariant: tabular },
  caption: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, fontVariant: tabular },
  /** Rótulo de un campo, siempre encima de la caja. */
  label: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20 },
  /** Insignia de estado: versalitas a 0.12em. */
  badge: { ...etiqueta, letterSpacing: 1.44 },
  /** Etiqueta de sección y rótulos de datos (versalitas a 0.16em). */
  overline: etiqueta,
  /** Texto de los botones: la misma etiqueta en versalitas. */
  button: etiqueta,
  price: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22, fontVariant: tabular },
  /** Cifra de un indicador (StatCard). */
  stat: {
    fontFamily: fonts.displayMedium,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.3,
    fontVariant: serifFigures,
  },
  /** Monto principal de una pantalla (el total a cobrar, lo cobrado hoy). */
  amount: {
    fontFamily: fonts.displayMedium,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -0.4,
    fontVariant: serifFigures,
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyToken = keyof typeof typography;
