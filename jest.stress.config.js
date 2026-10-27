/**
 * Pruebas de esfuerzo (npm run test:stress). Corren en serie (--runInBand) para que una no le robe
 * CPU a otra, con el GC expuesto para medir memoria. Generan reports/stress/stress-report.{json,md}.
 */
const base = require('./jest.config');

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  testMatch: ['<rootDir>/src/__tests__/stress/**/*.stress.test.{ts,tsx}'],
  testPathIgnorePatterns: ['/node_modules/'],
  collectCoverage: false,
  reporters: ['default', ['<rootDir>/scripts/testing/stress-reporter.js', { outputDir: 'reports/stress' }]],
};
