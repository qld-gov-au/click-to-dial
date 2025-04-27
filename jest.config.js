module.exports = {
  testEnvironment: 'jsdom', // Simulates a browser environment
  roots: ['<rootDir>/src'], // Specifies the root directory for tests
  testMatch: [
    '**/?(*.)+(test|spec).[jt]s?(x)' // Matches files like *.test.js or *.spec.js
  ],
  collectCoverage: true, // Enables coverage reporting
  collectCoverageFrom: [
    '**/*.js', // Include all JavaScript files
    '!**/node_modules/**', // Exclude dependencies
    '!**/dist/**', // Exclude build output
    '!**/*.test.js', // Exclude test files themselves
    '!**/*.spec.js' // Exclude spec files themselves
  ],
  coverageDirectory: 'coverage', // Separate Jest coverage directory
  coverageReporters: ['json', 'html', 'text'], // Include JSON for merging
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy' // Mock CSS imports
  }
};
