const { Duration } = require('luxon')
const formatDuration = require('./duration')

describe('duration', () => {
  it('formats Duration into a duration string', () => {
    let duration = Duration.fromObject({ hours: 3, minutes: 30, seconds: 45 })
    expect(formatDuration(duration)).toBe('3h 30m 45s')
  })

  it('omits hours if less than one hour', () => {
    let duration = Duration.fromObject({ minutes: 26, seconds: 15 })
    expect(formatDuration(duration)).toBe('26m 15s')
  })

  it('omits minutes if less than one minute', () => {
    let duration = Duration.fromObject({ seconds: 58 })
    expect(formatDuration(duration)).toBe('58s')
  })

  it('displays minutes even if minutes is 0 when longer than one hour', () => {
    let duration = Duration.fromObject({ hours: 52, minutes: 0, seconds: 7 })
    expect(formatDuration(duration)).toBe('52h 0m 7s')
  })

  it('displays seconds even if seconds is 0 when longer than one minute', () => {
    let duration = Duration.fromObject({ minutes: 16 })
    expect(formatDuration(duration)).toBe('16m 0s')
  })

  it('uses long hour/minute/second labels when "long" option is passed', () => {
    let duration = Duration.fromObject({ hours: 2, minutes: 13, seconds: 42 })
    let duration2 = Duration.fromObject({ hours: 4 })
    expect(formatDuration(duration, { long: true })).toBe('2 hours 13 minutes 42 seconds')
    expect(formatDuration(duration2, { long: true })).toBe('4 hours 0 minutes 0 seconds')
  })
})
