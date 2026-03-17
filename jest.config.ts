import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],

  moduleNameMapper: {
    // Rewrite .js imports → .ts so ts-jest can resolve them in ESM mode
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },

  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }]
  },

  testMatch: ['**/__tests__/**/*.test.ts'],

  // Required for jest.unstable_mockModule (ESM mocking)
  // jest object must be imported from @jest/globals in test files,
  // not used as a global — ESM does not support hoisted jest.mock()
  clearMocks: true,

  collectCoverageFrom: [
    'src/services/**.ts',
    'src/controllers/**.ts',
    'src/middlewares/**.ts'
  ]

  // coverageThreshold: {
  //   global: {
  //     branches: 70,
  //     functions: 80,
  //     lines: 80,
  //     statements: 80
  //   }
  // }
};

export default config;
