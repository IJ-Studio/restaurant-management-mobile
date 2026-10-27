/**
 * Pruebas de aceptación (npm run test:acceptance). Recorren la app completa por rol contra el API falso.
 * Además de la salida normal generan reports/acceptance/junit.xml y la matriz de trazabilidad.
 */
const base = require('./jest.config');

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  testMatch: ['<rootDir>/src/__tests__/acceptance/**/*.acceptance.test.tsx'],
  testPathIgnorePatterns: ['/node_modules/'],
  collectCoverage: false,
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'reports/acceptance',
        outputName: 'junit.xml',
        suiteName: 'Pruebas de aceptación',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        addFileAttribute: 'true',
      },
    ],
    ['<rootDir>/scripts/testing/acceptance-reporter.js', { outputDir: 'reports/acceptance' }],
  ],
};
