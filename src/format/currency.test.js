const currency = require("./currency");

describe("currency", () => {
  it("prepends $ unless another symbol is specified", () => {
    expect(currency(42.51)).toBe("$42.51");
  });

  it("prepends a specified currency symbol", () => {
    expect(currency(42.51, { symbol: "€" })).toBe("€42.51");
  });

  it("appends the symbol if options.appendSymbol is true", () => {
    expect(currency(42.51, { symbol: "zł", appendSymbol: true })).toBe(
      "42.51zł"
    );
    expect(currency(65.5, { appendSymbol: true })).toBe("65.50$");
  });

  it("adds commas to numbers longer than three digits", () => {
    expect(currency(1000)).toBe("$1,000.00");
    expect(currency(59123)).toBe("$59,123.00");
  });

  it("does not add comma if the length is a multiple of three", () => {
    expect(currency(999)).toBe("$999.00");
    expect(currency(456789)).toBe("$456,789.00");
  });

  it("works for cent amounts if called as currency.cents()", () => {
    expect(currency.cents(999)).toBe("$9.99");
  });
});
