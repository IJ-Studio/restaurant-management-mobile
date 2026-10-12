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
    ignores: ['dist/*', 'coverage/*'],
  },
]);
