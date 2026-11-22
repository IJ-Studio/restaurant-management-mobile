// `orientation: portrait` pone screenOrientation="portrait" en la actividad, y Play deduce de ahí
// android.hardware.screen.portrait como obligatoria: excluye tablets, escritorio y Android XR.
// Se declara opcional; la app sigue bloqueada en vertical.
const { withAndroidManifest } = require('expo/config-plugins');

const FUNCION = 'android.hardware.screen.portrait';

function portraitOpcional(androidManifest) {
  const { manifest } = androidManifest;
  manifest['uses-feature'] = (manifest['uses-feature'] ?? []).filter(
    (f) => f.$['android:name'] !== FUNCION,
  );
  manifest['uses-feature'].push({ $: { 'android:name': FUNCION, 'android:required': 'false' } });
  return androidManifest;
}

module.exports = (config) =>
  withAndroidManifest(config, (mod) => {
    mod.modResults = portraitOpcional(mod.modResults);
    return mod;
  });
module.exports.portraitOpcional = portraitOpcional;
