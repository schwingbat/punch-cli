const { Interval, DateTime } = require('luxon')
const fuzzyParse = require('./fuzzy-parse')

function dayIsWithin (interval, datetime) {
  return datetime.valueOf() >= interval.start.valueOf() &&
         datetime.valueOf() <= interval.end.valueOf()
}

describe('fuzzyParse', () => {
  let day
  beforeEach(() => {
    day = DateTime.fromObject({ year: 2018, month: 4, day: 26 })
  })

  it('returns current day for "today"', () => {
    const parsed = fuzzyParse('today', day)
    expect(dayIsWithin(parsed.interval(), day)).toBe(true)
    expect(parsed.unit()).toBe('day')
    expect(parsed.modifier()).toBe(0)
  })

  it('returns current day for "now"', () => {
    const parsed = fuzzyParse('now', day).interval()
    expect(dayIsWithin(parsed, day)).toBe(true)
  })

  it('works for "yesterday"', () => {
    const parsed = fuzzyParse('yesterday', day).interval()
    expect(dayIsWithin(parsed, day.minus({ days: 1 }))).toBe(true)
  })

  it.skip('works for "tomorrow"', () => {
    const parsed = fuzzyParse('tomorrow', day).interval()
    expect(dayIsWithin(parsed, day.plus({ days: 1 }))).toBe(true)
  })

  it.skip('works for "___ from now"', () => {
    const parsed = fuzzyParse('three days from now').interval()
    expect(dayIsWithin(parsed, day.plus({ days: 3 }))).toBe(true)
  })

  it('works for numbers in English: num ___ ago', () => {
    const one = fuzzyParse('one day ago', day).interval()
    expect(one instanceof Interval).toBe(true)
    expect(dayIsWithin(one, day.minus({ days: 1 }))).toBe(true)

    const seven = fuzzyParse('seven days ago', day).interval()
    expect(seven instanceof Interval).toBe(true)
    expect(dayIsWithin(seven, day.minus({ days: 7 }))).toBe(true)
  })

  it('works for numeric numbers: num ___ ago', () => {
    const six = fuzzyParse('6 days ago', day).interval()
    expect(dayIsWithin(six, day.minus({ days: 6 }))).toBe(true)
  })

  it('parses relative weeks', () => {
    const minusTwo = fuzzyParse('2 weeks ago', day)
    expect(minusTwo.unit()).toBe('week')
    expect(minusTwo.modifier()).toBe(-2)
    expect(dayIsWithin(minusTwo.interval(), day.minus({ weeks: 2 }))).toBe(true)

    const current = fuzzyParse('this week', day)
    expect(current.unit()).toBe('week')
    expect(current.modifier()).toBe(0)
    expect(dayIsWithin(current.interval(), day)).toBe(true)
  })

  it('parses relative months', () => {
    const minusFive = fuzzyParse('five months ago', day)
    expect(minusFive.unit()).toBe('month')
    expect(minusFive.modifier()).toBe(-5)
    expect(dayIsWithin(minusFive.interval(), day.minus({ months: 5 }))).toBe(true)

    const last = fuzzyParse('last month', day)
    expect(last.unit()).toBe('month')
    expect(last.modifier()).toBe(-1)
    expect(dayIsWithin(last.interval(), day.minus({ months: 1 }))).toBe(true)
  })

  it('parses relative years', () => {
    // const minus
  })

  it('parses weekdays', () => {

  })

  it('parses months by name', () => {

  })
})
