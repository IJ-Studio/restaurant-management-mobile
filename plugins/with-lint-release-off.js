// El lint vital del Release resuelve las dependencias `compileOnly` de @stripe/stripe-react-native
// (push provisioning → play-services-tapandpay), que no están en Maven: sin esto, el build de
// Release (local y EAS) falla. El lint sigue en el CI con ESLint; este paso de Gradle no aporta.
const { withAppBuildGradle } = require('expo/config-plugins');

const BLOQUE = 'lint {\n        checkReleaseBuilds false\n    }';

function desactivarLintRelease(gradle) {
  if (gradle.includes('checkReleaseBuilds false')) return gradle;
  return gradle.replace(/android\s*\{/, (inicio) => `${inicio}\n    ${BLOQUE}`);
}

module.exports = (config) =>
  withAppBuildGradle(config, (mod) => {
    mod.modResults.contents = desactivarLintRelease(mod.modResults.contents);
    return mod;
  });
module.exports.desactivarLintRelease = desactivarLintRelease;
