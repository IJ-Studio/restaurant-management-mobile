/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/src/core/testing/jestSetup.ts'],

  // `npm test` corre unitarias e integración. Aceptación y esfuerzo tienen su propio script
  // (test:acceptance, test:stress) y su etapa en CI; las de rendimiento (src/__perf__) las corre Reassure.
  testPathIgnorePatterns: ['/node_modules/', '\\.acceptance\\.test\\.', '\\.stress\\.test\\.'],

  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__fixtures__/**',
    '!src/__perf__/**',
    '!src/core/testing/**',
    '!**/*.d.ts',
  ],

  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    // Casos de uso, datos y ViewModels de cada historia: ≥ 80% de líneas por archivo.
    './src/features/**/domain/usecases/**': { lines: 80 },
    './src/features/**/data/**': { lines: 80 },
    './src/features/**/presentation/viewmodels/**': { lines: 80 },
  },
};
