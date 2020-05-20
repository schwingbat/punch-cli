const parseDateTime = require("./parse-datetime");
const isSameDay = require("date-fns/isSameDay");

describe("parseDateTime", () => {
  it("parses datetime with 12-hour time", () => {
    expect(parseDateTime("10.12.2014@5:52:02PM")).toEqual(
      new Date(2014, 9, 12, 17, 52, 2)
    );
    expect(parseDateTime("2015-10-09@12:10AM")).toEqual(
      new Date(2015, 9, 9, 0, 10, 0)
    );
    expect(parseDateTime("2014/10/8@10:12am")).toEqual(
      new Date(2014, 9, 8, 10, 12, 0)
    );
  });

  it("parses datetime with 24-hour time", () => {
    expect(parseDateTime("4.10.2016@15:30")).toEqual(
      new Date(2016, 3, 10, 15, 30, 0)
    );
    expect(parseDateTime("1995-10-16@8:06:15")).toEqual(
      new Date(1995, 9, 16, 8, 6, 15)
    );
  });

  it("returns null if time is not parseable", () => {
    expect(parseDateTime("f")).toBe(null);
  });

  it("parses just the time", () => {
    const expected = new Date();
    expected.setHours(22, 30, 0, 0);
    expected.setMilliseconds(0);
    expect(parseDateTime("10:30PM")).toEqual(expected);

    // Same day
    expect(parseDateTime("11:51pm").getDate()).toEqual(new Date().getDate());
    expect(parseDateTime("12:24PM").getDate()).toEqual(new Date().getDate());
    expect(parseDateTime("12:44AM").getDate()).toEqual(new Date().getDate());
    expect(parseDateTime("12:59PM").getDate()).toEqual(new Date().getDate());
  });

  it("parses date without a time", () => {
    const expected = new Date(2016, 2, 5);
    expect(isSameDay(parseDateTime("2016-3-5"), expected)).toBe(true);
    expect(isSameDay(parseDateTime("3/5/2016"), expected)).toBe(true);
    expect(isSameDay(parseDateTime("3.5.2016"), expected)).toBe(true);
  });
});
