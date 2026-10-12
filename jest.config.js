/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',

  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__fixtures__/**',
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
  },
};
