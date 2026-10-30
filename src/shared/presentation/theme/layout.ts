import type { ViewStyle } from 'react-native';

/** Escala de 4 px, la misma de Tailwind en la web. */
export const spacing = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

/**
 * Radios de la web: `rounded-lg` (inputs), `rounded-xl` (botones), `rounded-2xl` y las tarjetas.
 * Las tarjetas del menú usan 40 en la web; en el celular se ven exageradas y quedan en 24.
 */
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;

/** Sombras café suaves de la web (T.shadow y T.shadowHov), con `boxShadow` igual que en CSS. */
export const shadows = {
  card: { boxShadow: '0 2px 16px rgba(26, 18, 8, 0.07)' },
  raised: { boxShadow: '0 8px 32px rgba(26, 18, 8, 0.12)' },
  /** Botón principal: sombra con el naranja de marca, como `shadow-brand/30`. */
  brand: { boxShadow: '0 6px 16px rgba(232, 93, 4, 0.28)' },
} as const satisfies Record<string, ViewStyle>;

export const sizes = {
  /** Área táctil mínima (Apple HIG / WCAG 2.5.5). */
  touchTarget: 44,
  /** Alto de botones e inputs. */
  control: 52,
  /** Lado de la miniatura de un platillo en las listas. */
  thumbnail: 64,
  /** Ancho del logo en el Login. */
  logo: 220,
} as const;

/** Opacidades: botón deshabilitado (`opacity-40` de la web), fila atenuada que se sigue leyendo y presionado. */
export const opacity = { disabled: 0.4, dimmed: 0.6, pressed: 0.85 } as const;
