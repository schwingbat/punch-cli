const fuzzyParse = require("./fuzzy-parse");
const addDays = require("date-fns/addDays");
const addWeeks = require("date-fns/addWeeks");
const addMonths = require("date-fns/addMonths");

function dayIsWithin(interval, datetime) {
  return (
    datetime.getTime() >= interval.start.getTime() &&
    datetime.getTime() <= interval.end.getTime()
  );
}

describe("fuzzyParse", () => {
  let day;
  beforeEach(() => {
    day = new Date(2018, 3, 26);
  });

  it("returns a specific date", () => {
    const parsed = fuzzyParse("10/15/2018", { now: day });
    expect(parsed.unit).toBe("day");
    expect(parsed.modifier).toBe(172);

    const expectedStart = new Date(2018, 9, 15);
    const expectedEnd = new Date(2018, 9, 15);
    expectedStart.setHours(0, 0, 0, 0);
    expectedEnd.setHours(23, 59, 59, 999);

    expect(parsed.start.getTime()).toEqual(expectedStart.getTime());
    expect(parsed.end.getTime()).toEqual(expectedEnd.getTime());
  });

  it('returns current day for "today"', () => {
    const parsed = fuzzyParse("today", { now: day });
    expect(dayIsWithin(parsed, day)).toBe(true);
    expect(parsed.unit).toBe("day");
    expect(parsed.modifier).toBe(0);
  });

  it('returns current day for "now"', () => {
    const parsed = fuzzyParse("now", { now: day });
    expect(dayIsWithin(parsed, day)).toBe(true);
  });

  it('works for "yesterday"', () => {
    const parsed = fuzzyParse("yesterday", { now: day });
    expect(dayIsWithin(parsed, addDays(day, -1))).toBe(true);
  });

  it('works for "tomorrow"', () => {
    const parsed = fuzzyParse("tomorrow", { now: day });
    expect(dayIsWithin(parsed, addDays(day, 1))).toBe(true);
  });

  it.skip('works for "___ from now"', () => {
    const parsed = fuzzyParse("three days from now");
    expect(dayIsWithin(parsed, addDays(day, 3))).toBe(true);
  });

  it("works for numbers in English: num ___ ago", () => {
    const one = fuzzyParse("one day ago", { now: day });
    expect(one.start instanceof Date && one.end instanceof Date).toBe(true);
    expect(dayIsWithin(one, addDays(day, -1))).toBe(true);

    const seven = fuzzyParse("seven days ago", { now: day });
    expect(seven.start instanceof Date && seven.end instanceof Date).toBe(true);
    expect(dayIsWithin(seven, addDays(day, -7))).toBe(true);
  });

  it("works for numeric numbers: num ___ ago", () => {
    const six = fuzzyParse("6 days ago", { now: day });
    expect(dayIsWithin(six, addDays(day, -6))).toBe(true);
  });

  it("parses relative weeks", () => {
    const minusTwo = fuzzyParse("2 weeks ago", { now: day });
    expect(minusTwo.unit).toBe("week");
    expect(minusTwo.modifier).toBe(-2);
    expect(dayIsWithin(minusTwo, addWeeks(day, -2))).toBe(true);

    const current = fuzzyParse("this week", { now: day });
    expect(current.unit).toBe("week");
    expect(current.modifier).toBe(0);
    expect(dayIsWithin(current, day)).toBe(true);
  });

  it("parses relative months", () => {
    const minusFive = fuzzyParse("five months ago", { now: day });
    expect(minusFive.unit).toBe("month");
    expect(minusFive.modifier).toBe(-5);
    expect(dayIsWithin(minusFive, addMonths(day, -5))).toBe(true);

    const last = fuzzyParse("last month", { now: day });
    expect(last.unit).toBe("month");
    expect(last.modifier).toBe(-1);
    expect(dayIsWithin(last, addMonths(day, -1))).toBe(true);
  });

  it("parses relative years", () => {
    // Like what? 'two years ago?'
  });

  it("parses weekdays", () => {});

  it("parses months by name", () => {});

  it("parses date strings", () => {
    const parsed = fuzzyParse("4/12/2018", { now: day });

    expect(parsed.unit).toBe("day");
    expect(parsed.modifier).toBe(-14);

    const expectedStart = new Date(2018, 3, 12);
    const expectedEnd = new Date(expectedStart);
    expectedStart.setHours(0, 0, 0, 0);
    expectedEnd.setHours(23, 59, 59, 999);

    expect(parsed.start.getTime()).toBe(expectedStart.getTime());
    expect(parsed.end.getTime()).toBe(expectedEnd.getTime());
  });

  it("parses just the name of a month", () => {});

  it("parses just a year", () => {});
});
