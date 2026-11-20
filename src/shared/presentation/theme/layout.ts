import type { ViewStyle } from 'react-native';

import { colors } from './colors';
import { webRadius } from './webTokens';

/** Escala de 4 px, la misma de Tailwind en la web. */
export const spacing = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

/**
 * Radios estrictos de DESIGN.md: `sm` control (botones, campos, mesas cuadradas), `md` tarjeta,
 * `lg` diálogo (modales y hojas) y `pill` solo para insignias de estado y mesas/sillas redondas.
 */
export const radius = {
  sm: webRadius.control,
  md: webRadius.tarjeta,
  lg: webRadius.dialogo,
  pill: webRadius.pastilla,
} as const;

/** Sombras café suaves de la web (T.shadow y T.shadowHov), con `boxShadow` igual que en CSS. */
export const shadows = {
  card: { boxShadow: '0 2px 16px rgba(26, 18, 8, 0.07)' },
  raised: { boxShadow: '0 8px 32px rgba(26, 18, 8, 0.12)' },
  /** Botón principal: sombra con el naranja de marca, como `shadow-brand/30`. */
  brand: { boxShadow: '0 6px 16px rgba(131, 94, 37, 0.28)' },
} as const satisfies Record<string, ViewStyle>;

export const sizes = {
  /** Área táctil mínima (Apple HIG / WCAG 2.5.5). */
  touchTarget: 44,
  /** Alto de botones e inputs (2.75rem de la web). */
  control: 44,
  /** Lado de la miniatura de un platillo en las listas. */
  thumbnail: 64,
  /** Ancho del logo en el Login. */
  logo: 220,
} as const;

/** Degradado de marca de los encabezados (Login, Dashboard, Perfil, cobro), de arriba-izquierda a abajo-derecha. */
export const gradients = {
  brand: [colors.brandStrong, colors.brandDeep] as const,
} as const;

/** Al presionar, el control baja 1 px (`translateY(1px)` de la web): respuesta física sin animación. */
export const pressOffset = { transform: [{ translateY: 1 }] } as const satisfies ViewStyle;

/** Opacidades: botón deshabilitado (`opacity-40` de la web), fila atenuada que se sigue leyendo y presionado. */
export const opacity = { disabled: 0.4, dimmed: 0.6, pressed: 0.85 } as const;
