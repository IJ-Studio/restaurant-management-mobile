// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const security = require('eslint-plugin-security');
const sonarjs = require('eslint-plugin-sonarjs');

module.exports = defineConfig([
  expoConfig,
  security.configs.recommended,
  {
    // Quality gate: complejidad cognitiva ≤ 15 por función.
    plugins: { sonarjs },
    rules: { 'sonarjs/cognitive-complexity': ['error', 15] },
  },
  {
    // En TS las claves ya están limitadas por tipos (Role, Section): la regla solo da falsos positivos.
    files: ['**/*.ts', '**/*.tsx'],
    rules: { 'security/detect-object-injection': 'off' },
  },
  {
    // Las regex dinámicas de las pruebas no procesan entrada de usuarios.
    files: ['**/__tests__/**'],
    rules: { 'security/detect-non-literal-regexp': 'off' },
  },
  {
    // Herramientas de CI en Node (scripts/ y configuración de Jest): leen y escriben los reportes en
    // rutas que reciben por argumentos del propio pipeline, no datos de usuarios.
    files: ['scripts/**/*.js', '*.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'writable',
        process: 'readonly',
        console: 'readonly',
      },
    },
    rules: { 'security/detect-non-literal-fs-filename': 'off', 'security/detect-object-injection': 'off' },
  },
  {
    // La infraestructura de pruebas escribe sus reportes en reports/ con rutas armadas en el código,
    // no con datos de usuarios.
    files: ['src/core/testing/**'],
    rules: { 'security/detect-non-literal-fs-filename': 'off' },
  },
  {
    ignores: ['dist/*', 'coverage/*', 'reports/*', '.reassure/*'],
  },
]);
