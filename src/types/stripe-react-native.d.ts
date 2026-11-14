// Tipos de las rutas internas que usa StripePaymentGateway: son las mismas funciones que exporta el índice.
declare module '@stripe/stripe-react-native/lib/module/functions' {
  export { initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';
}

declare module '@stripe/stripe-react-native/lib/module/components/StripeProvider' {
  export { initStripe } from '@stripe/stripe-react-native';
}
