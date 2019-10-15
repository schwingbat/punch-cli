const chalk = require("chalk");
const ansiLength = require("./print-length");

describe("printLength", () => {
  it("returns the visual length of a string containing ANSI escape codes", () => {
    expect(ansiLength(chalk.yellow("hello"))).toBe(5);
    expect(ansiLength("nocodes")).toBe(7);
    expect(ansiLength(chalk.bold.green("BOLD"))).toBe(4);
  });
});
