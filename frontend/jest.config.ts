import nextJest from 'next/jest';

const createJestConfig = nextJest({
  dir: './', // path to your Next.js app
});

const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Optional: if you keep tests in a custom folder
  // roots: ['<rootDir>'],
  // testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
};

// next/jest returns a function, which wraps your config
export default createJestConfig(config);
