export default {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec).js'],
  testPathIgnorePatterns: ['/node_modules/', '__tests__/fixtures/', '__tests__/integration/setup.js'],
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  collectCoverageFrom: [
    'model/**/*.js',
    'middleware/**/*.js',
    'routes.js',
    '!**/node_modules/**',
  ],
};
