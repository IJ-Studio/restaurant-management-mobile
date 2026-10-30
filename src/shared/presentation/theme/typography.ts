import type { TextStyle } from 'react-native';

/**
 * Tipografía del panel de la web: Fraunces (serif con carácter) para títulos y montos, y DM Sans
 * (sans muy legible en tamaños chicos) para todo lo demás. Con fuentes propias cada peso es su
 * propia familia (`fontWeight` no elige el archivo), por eso los estilos usan `fontFamily`.
 * Los nombres coinciden con las claves que carga `appFonts`.
 */
export const fonts = {
  display: 'Fraunces_700Bold',
  displayMedium: 'Fraunces_600SemiBold',
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
} as const;

/** Escala tipográfica. */
export const typography = {
  /** Títulos de portada (Login, Dashboard), como los h1 de la web: apretados y gruesos. */
  display: { fontFamily: fonts.display, fontSize: 34, lineHeight: 40, letterSpacing: -0.6 },
  title: { fontFamily: fonts.display, fontSize: 26, lineHeight: 32, letterSpacing: -0.3 },
  heading: { fontFamily: fonts.displayMedium, fontSize: 20, lineHeight: 26 },
  subheading: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 23 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 23 },
  small: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  /** Texto de las pastillas de estado (`text-xs font-bold` de la web). */
  badge: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 16 },
  /** Etiqueta de categoría de la web: mayúsculas chicas y espaciadas (`text-xs uppercase tracking-widest`). */
  overline: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  /** Botón principal: 18 en negrita cuenta como texto grande, así el blanco sobre `brand` pasa AA. */
  button: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 22 },
  price: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22 },
  /** Monto principal de una pantalla (el total a cobrar, las ventas del día). */
  amount: { fontFamily: fonts.display, fontSize: 44, lineHeight: 50, letterSpacing: -1 },
} as const satisfies Record<string, TextStyle>;

export type TypographyToken = keyof typeof typography;
