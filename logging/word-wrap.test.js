const wrap = require('./word-wrap')

describe('wordWrap', () => {
  it('returns what it got if the length is less than the wrap length', () => {
    expect(wrap('this is too short', 50)).toBe('this is too short')
  })

  it('inserts a newline at the nearest word boundary if line is longer than wrap length', () => {
    expect(wrap('this should break at some point', 20)).toBe('this should break at\nsome point')
    expect(wrap('Web development and eCommerce for an Arizona-based company specializing in medical scrubs', 60, 2))
      .toBe('Web development and eCommerce for an Arizona-based company\n  specializing in medical scrubs')
  })

  it('adds a number of spaces at breaks if requested', () => {
    expect(wrap('this should be indented', 15, 2)).toBe('this should be\n  indented')
  })
})
