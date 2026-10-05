// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const security = require("eslint-plugin-security");
const reactNative = require("eslint-plugin-react-native");
const prettierRecommended = require("eslint-plugin-prettier/recommended");

module.exports = defineConfig([
  expoConfig,
  security.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-native": reactNative },
    rules: {
      "react-native/no-unused-styles": "error",
      "react-native/no-inline-styles": "warn",
      "react-native/no-raw-text": "error",
    },
  },
  prettierRecommended,
  {
    ignores: ["dist/*", "coverage/*", ".expo/*", "node_modules/*"],
  },
]);
