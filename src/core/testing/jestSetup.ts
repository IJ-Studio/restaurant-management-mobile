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

// El SDK de Stripe necesita su módulo nativo: en Jest se usa el mock oficial de la librería.
jest.mock('@stripe/stripe-react-native', () =>
  jest.requireActual('@stripe/stripe-react-native/jest/mock.js'),
);
// Rutas internas que importa StripePaymentGateway: el mismo mock.
jest.mock('@stripe/stripe-react-native/lib/module/functions', () =>
  jest.requireMock('@stripe/stripe-react-native'),
);
jest.mock('@stripe/stripe-react-native/lib/module/components/StripeProvider', () =>
  jest.requireMock('@stripe/stripe-react-native'),
);
