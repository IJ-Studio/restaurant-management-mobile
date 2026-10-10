// Envuelve la configuración de Metro de Expo para que Sentry pueda
// asociar los source maps y mostrar stack traces legibles.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
