module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  coveragePathIgnorePatterns: ['/node_modules/', '/src/server.ts'],
};
