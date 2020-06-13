const makeColorizer = require("./make-project-colorizer");

describe("getProjectColorizer", () => {
  test("accepts color names", () => {
    const blue = makeColorizer({ color: "blue" })("test");
    const red = makeColorizer({ color: "red" })("test");
    const yellow = makeColorizer({ color: "yellow" })("test");
    const cyan = makeColorizer({ color: "cyan" })("test");

    expect(blue).toBe("\u001b[34mtest\u001b[39m");
    expect(red).toBe("\u001b[31mtest\u001b[39m");
    expect(yellow).toBe("\u001b[33mtest\u001b[39m");
    expect(cyan).toBe("\u001b[36mtest\u001b[39m");
  });

  test("accepts hex colors", () => {
    const magenta = makeColorizer({ color: "#ff0088" })("test");

    expect(magenta).toBe("\u001b[38;2;255;0;136mtest\u001b[39m");
  });
});
