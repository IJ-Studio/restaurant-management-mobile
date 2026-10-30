import {
  IbarraRealNova_400Regular,
  IbarraRealNova_500Medium,
  IbarraRealNova_600SemiBold,
  IbarraRealNova_700Bold,
} from '@expo-google-fonts/ibarra-real-nova';

import { fonts } from './typography';

/**
 * Archivos de fuente para `useFonts` en App.tsx. Va aparte del índice del tema para que las
 * pantallas (y sus pruebas) no carguen los .ttf al importar los tokens.
 */
export const appFonts = {
  [fonts.regular]: IbarraRealNova_400Regular,
  [fonts.medium]: IbarraRealNova_500Medium,
  [fonts.semibold]: IbarraRealNova_600SemiBold,
  [fonts.bold]: IbarraRealNova_700Bold,
};
