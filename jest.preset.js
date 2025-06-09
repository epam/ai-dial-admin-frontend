const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!*.config.{js,ts}',
    '!*.d.ts',
    '!**/.next/**',
    '!**/vendor/**',
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['clover', 'json', 'lcov', 'text', 'html'],
  coverageThreshold: {
    global: {
      branches: 35,
      functions: 40,
      lines: 45,
      statements: 45,
    },
  },
  setupFilesAfterEnv: ['./jest.setup.js'],
};
