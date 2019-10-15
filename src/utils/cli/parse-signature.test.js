const parseSignature = require("./parse-signature");

describe("parseSignature", () => {
  it("returns empty argMap array if no params are named", () => {
    expect(parseSignature("command")).toEqual([]);
  });

  it("returns filled in argMap array for named params", () => {
    expect(parseSignature("command <one> <two> <three>")).toEqual([
      {
        name: "one",
        required: true,
        variadic: false
      },
      {
        name: "two",
        required: true,
        variadic: false
      },
      {
        name: "three",
        required: true,
        variadic: false
      }
    ]);
  });

  it("sets required to false for params in [square brackets]", () => {
    expect(parseSignature("command <one> [two]")).toEqual([
      {
        name: "one",
        required: true,
        variadic: false
      },
      {
        name: "two",
        required: false,
        variadic: false
      }
    ]);
  });

  it('sets variadic to true for params ending in "..."', () => {
    expect(parseSignature("command <one> [two...]")).toEqual([
      {
        name: "one",
        required: true,
        variadic: false
      },
      {
        name: "two",
        required: false,
        variadic: true
      }
    ]);
  });
});
