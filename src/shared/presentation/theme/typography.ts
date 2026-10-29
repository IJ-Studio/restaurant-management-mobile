import type { TextStyle } from 'react-native';

/**
 * Ibarra Real Nova, la serif del sitio público. Con fuentes propias cada peso es su propia familia
 * (`fontWeight` no elige el archivo), por eso los estilos usan `fontFamily` y no `fontWeight`.
 * Los nombres coinciden con las claves que carga `appFonts`.
 */
export const fonts = {
  regular: 'IbarraRealNova_400Regular',
  medium: 'IbarraRealNova_500Medium',
  semibold: 'IbarraRealNova_600SemiBold',
  bold: 'IbarraRealNova_700Bold',
} as const;

/** Escala tipográfica. Ibarra tiene la x baja, así que el texto corrido arranca en 16. */
export const typography = {
  /** Títulos grandes (Login), como `auth-title` y los h1 de la web: apretados y gruesos. */
  display: { fontFamily: fonts.bold, fontSize: 34, lineHeight: 38, letterSpacing: -0.5 },
  title: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 30, letterSpacing: -0.3 },
  heading: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 25 },
  subheading: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 },
  small: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  /** Texto de las pastillas de estado (`text-xs font-bold` de la web). */
  badge: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 16 },
  /** Etiqueta de categoría de la web: mayúsculas chicas y espaciadas (`text-xs uppercase tracking-widest`). */
  overline: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  /** Botón principal: 18 en negrita cuenta como texto grande, así el blanco sobre `brand` pasa AA. */
  button: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 22 },
  price: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 22 },
  /** Monto principal de una pantalla (el total a cobrar). */
  amount: { fontFamily: fonts.bold, fontSize: 44, lineHeight: 50, letterSpacing: -1 },
} as const satisfies Record<string, TextStyle>;

export type TypographyToken = keyof typeof typography;
