// Solo para builds locales de prueba: APP_ANDROID_PACKAGE cambia el identificador para que la app
// conviva en el teléfono con la instalada desde Google Play. EAS no define la variable y usa app.json.
module.exports = ({ config }) => {
  const localPackage = process.env.APP_ANDROID_PACKAGE;
  if (!localPackage) return config;
  return {
    ...config,
    name: `${config.name} (pruebas)`,
    android: { ...config.android, package: localPackage },
  };
};
