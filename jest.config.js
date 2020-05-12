module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  reporters: ["default", "jest-junit"],
  coverageReporters: ["cobertura"],
  coverageDirectory: "./test-output",
};
