const parseDateTime = require('./parse-datetime')

describe('parseDateTime', () => {
  it('parses datetime with 12-hour time', () => {
    expect(parseDateTime('10.12.2014@5:52:02PM')).toEqual(new Date(2014, 9, 12, 17, 52, 2))
    expect(parseDateTime('2014/10/8@10:12am')).toEqual(new Date(2014, 9, 8, 10, 12, 0))
  })

  it('parses datetime with 24-hour time', () => {
    expect(parseDateTime('4.10.2016@15:30')).toEqual(new Date(2016, 3, 10, 15, 30, 0))
    expect(parseDateTime('1995-10-16@8:06:15')).toEqual(new Date(1995, 9, 16, 8, 6, 15))
  })

  it('throws an error if date and time are not separated by @', () => {
    expect(() => {
      parseDateTime('8.10.2018-10:14:10')
    }).toThrow()
  })

  it('throws an error if date is not parseable', () => {
    expect(() => {
      parseDateTime('1.2.3@10:30AM')
    }).toThrow()
  })

  it('throws an error if hour is greater than 12 and PM is specified', () => {
    expect(() => {
      parseDateTime('10.10.2018@15:30PM')
    }).toThrow()
  })

  it('throws an error if time is not parseable', () => {
    expect(() => {
      parseDateTime('10.10.2018@4.12l3klsdf')
    }).toThrow()
  })
})
