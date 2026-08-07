export default {
  testEnvironment: "node",
  testTimeout: 30000,

  testMatch: ["**/tests/**/*.test.js"],

  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],

  transform: {},

  verbose: true,
  clearMocks: true,
  restoreMocks: true,

  coverageDirectory: "coverage",

  collectCoverageFrom: ["src/**/*.js", "!src/index.js"],
};
