const padWithLines = require("./pad-with-lines.js");

describe("padWithLines", () => {
  it("strips empty lines if passed zeroes", () => {
    expect(padWithLines("\n  \ntest string\n\n\n", 0, 0)).toEqual(
      "test string"
    );
  });

  it("adds empty lines to match given numbers", () => {
    expect(padWithLines("test string", 2, 1)).toBe("\n\ntest string\n");
  });

  it("applies top padding to bottom if no bottom padding is given", () => {
    expect(padWithLines("test string", 2)).toBe("\n\ntest string\n\n");
  });
});
