/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",

  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/__tests__/**",
    "!**/*.d.ts",
  ],

  coverageThreshold: {
    global: {
        branches: 0,
        functions: 0,
        lines: 0,
        statements: 0
    },
  },
};