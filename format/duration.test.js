const formatDuration = require('./duration')

const fromParts = (parts = {}) => {
  let time = 0
  time += parts.milliseconds || 0
  time += (parts.seconds || 0) * 1000
  time += (parts.minutes || 0) * 60000
  time += (parts.hours || 0) * 3600000
  return time
}

describe('duration', () => {
  it('formats Duration into a duration string', () => {
    expect(formatDuration(fromParts({ hours: 3, minutes: 30, seconds: 45 }))).toBe('3h 30m 45s')
  })

  it('omits hours if less than one hour', () => {
    expect(formatDuration(fromParts({ minutes: 26, seconds: 15 }))).toBe('26m 15s')
  })

  it('omits minutes if less than one minute', () => {
    expect(formatDuration(fromParts({ seconds: 58 }))).toBe('58s')
  })

  it('displays minutes even if minutes is 0 when longer than one hour', () => {
    expect(formatDuration(fromParts({ hours: 52, seconds: 7 }))).toBe('52h 0m 7s')
  })

  it('displays seconds even if seconds is 0 when longer than one minute', () => {
    expect(formatDuration(fromParts({ minutes: 16 }))).toBe('16m 0s')
  })

  it('uses long hour/minute/second labels when "long" option is passed', () => {
    expect(formatDuration(fromParts({ hours: 2, minutes: 13, seconds: 42 }), { long: true }))
      .toBe('2 hours 13 minutes 42 seconds')
    expect(formatDuration(fromParts({ hours: 4 }), { long: true }))
      .toBe('4 hours 0 minutes 0 seconds')
  })
})
