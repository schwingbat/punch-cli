const TimeSpan = require('./timespan')
const moment = require('moment')

const isWithin = (span, mo) => {
  return mo.valueOf() >= span.start && mo.valueOf() <= span.end
}

describe('TimeSpan', () => {
  describe('initialization', () => {
    it('sets start and end to the given parameters', () => {
      const span = new TimeSpan(0, 5000)
      expect(span.start).toBe(0)
      expect(span.end).toBe(5000)
    })
  })

  describe('fuzzyParse', () => {
    it('works for "today" and "now"', () => {
      const today = moment()
      const span = TimeSpan.fuzzyParse('today')
      expect(isWithin(span, today)).toBe(true)
      const span2 = TimeSpan.fuzzyParse('now')
      expect(isWithin(span2, today)).toBe(true)
    })

    it('works for "yesterday"', () => {
      const yesterday = moment().subtract(1, 'day')
      const span = TimeSpan.fuzzyParse('yesterday')
      expect(isWithin(span, yesterday)).toBe(true)
    })

    it('works for numbers in English: num ___ ago', () => {
      const oneDay = moment().subtract(1, 'day')
      const one = TimeSpan.fuzzyParse('one day ago')
      expect(isWithin(one, oneDay)).toBe(true)

      const sevenDay = moment().subtract(7, 'days')
      const seven = TimeSpan.fuzzyParse('seven days ago')
      expect(isWithin(seven, sevenDay)).toBe(true)
    })

    it('works for numeric numbers: num ___ ago', () => {
      const sixDay = moment().subtract(6, 'days')
      const six = TimeSpan.fuzzyParse('6 days ago')
      expect(isWithin(six, sixDay)).toBe(true)
    })
  })
})