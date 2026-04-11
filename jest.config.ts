import type { Config } from 'jest';

const config: Config = {
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/test/unit/**/*.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
      testTimeout: 30000,
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'test/tsconfig.json' }],
      },
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/test/integration/**/*.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
      testTimeout: 30000,
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'test/tsconfig.json' }],
      },
    },
  ],
};

export default config;
