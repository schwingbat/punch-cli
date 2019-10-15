const parseDateTime = require("./parse-datetime");

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

  it("throws an error if date and time are not separated by @", () => {
    expect(() => {
      parseDateTime("8.10.2018-10:14:10");
    }).toThrow();
  });

  it("throws an error if date is not parseable", () => {
    expect(() => {
      parseDateTime("1.2.3@10:30AM");
    }).toThrow();
  });

  it("throws an error if hour is greater than 12 and PM is specified", () => {
    expect(() => {
      parseDateTime("10.10.2018@15:30PM");
    }).toThrow();
  });

  it("throws an error if time is not parseable", () => {
    expect(() => {
      parseDateTime("10.10.2018@4.12l3klsdf");
    }).toThrow();
  });

  it("parses just the time", () => {
    const expected = new Date();
    expected.setHours(22, 30, 0);
    expect(parseDateTime("10:30PM")).toEqual(expected);

    // Same day
    expect(parseDateTime("11:51pm").getDate()).toEqual(new Date().getDate());
    expect(parseDateTime("12:24PM").getDate()).toEqual(new Date().getDate());
    expect(parseDateTime("12:44AM").getDate()).toEqual(new Date().getDate());
    expect(parseDateTime("12:59PM").getDate()).toEqual(new Date().getDate());
  });

  it("parses date without a time", () => {
    const expected = new Date(2016, 2, 5);
    expect(parseDateTime("2016-3-5")).toEqual(expected);
    expect(parseDateTime("3/5/2016")).toEqual(expected);
    expect(parseDateTime("3.5.2016")).toEqual(expected);
  });
});
