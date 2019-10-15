const parseDate = require("./parse-date");

describe("parseDate", () => {
  it("parses dates in MM/DD/YYYY format", () => {
    expect(parseDate("2/12/1998")).toEqual(new Date(1998, 1, 12));
    expect(parseDate("11/15/2026")).toEqual(new Date(2026, 10, 15));
  });

  it("parses dates in YYYY/MM/DD format", () => {
    expect(parseDate("2000/05/10")).toEqual(new Date(2000, 4, 10));
    expect(parseDate("1962/2/8")).toEqual(new Date(1962, 1, 8));
  });

  it("parses dates in MM/DD/YY format", () => {
    // Year should be relative to current century.
    // If year is after the current year, fall back to last century.
    expect(parseDate("10/12/91", new Date(2018, 10, 10))).toEqual(
      new Date(1991, 9, 12)
    );
    expect(parseDate("10/12/41", new Date(2098, 4, 12))).toEqual(
      new Date(2041, 9, 12)
    );
  });

  it('supports "/" as a delimiter', () => {
    expect(parseDate("1995/10/12")).toEqual(new Date(1995, 9, 12));
  });

  it('supports "-" as a delimiter', () => {
    expect(parseDate("2159-4-12")).toEqual(new Date(2159, 3, 12));
  });

  it('supports "." as a delimiter', () => {
    expect(parseDate("1492.8.6")).toEqual(new Date(1492, 7, 6));
  });

  it("returns null if format is not valid", () => {
    expect(parseDate("fish")).toEqual(null);
  });

  it("returns null if string is valid, but format could not be determined", () => {
    expect(parseDate("12/12/2")).toEqual(null);
    expect(parseDate("4.4.4")).toEqual(null);
  });
});
