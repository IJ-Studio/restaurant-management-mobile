import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';

import { fonts } from './typography';

/**
 * Archivos de fuente para `useFonts` en App.tsx. Va aparte del índice del tema para que las
 * pantallas (y sus pruebas) no carguen los .ttf al importar los tokens.
 */
export const appFonts = {
  [fonts.display]: Fraunces_700Bold,
  [fonts.displayMedium]: Fraunces_600SemiBold,
  [fonts.regular]: DMSans_400Regular,
  [fonts.medium]: DMSans_500Medium,
  [fonts.semibold]: DMSans_600SemiBold,
  [fonts.bold]: DMSans_700Bold,
};
