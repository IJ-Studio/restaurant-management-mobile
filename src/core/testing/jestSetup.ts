/**
 * Setup común de Jest (unitarias, integración, aceptación y esfuerzo).
 *
 * Los íconos de @expo/vector-icons cargan su fuente con expo-font al montarse; en Jest no hay registro
 * de assets y la carga falla. Se reemplazan por un View vacío con `testID` para poder ubicarlos si hace falta.
 */
jest.mock('@expo/vector-icons/Ionicons', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    __esModule: true,
    default: ({ name }: { name: string }) => createElement(View, { testID: `icon-${name}` }),
  };
});
