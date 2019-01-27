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
      .toBe('2 hours, 13 minutes and 42 seconds')
    expect(formatDuration(fromParts({ hours: 4 }), { long: true }))
      .toBe('4 hours, 0 minutes and 0 seconds')
  })

  it('wraps seconds into minutes at 60', () => {
    expect(formatDuration(39180000)).toBe('10h 53m 0s')
  })

  describe('resolutions', () => {
    let duration1 = fromParts({ hours: 5, minutes: 13, seconds: 12, milliseconds: 124 })
    let duration2 = fromParts({ minutes: 58, seconds: 15, milliseconds: 662 })
    let duration3 = fromParts({ hours: 15, minutes: 32, seconds: 58, milliseconds: 10 })

    it('returns the expected result if resolution is set to hours', () => {
      expect(formatDuration(duration1, { resolution: 'hours' })).toBe('5h')
      expect(formatDuration(duration2, { resolution: 'hours' })).toBe('1h')
      expect(formatDuration(duration3, { resolution: 'hours' })).toBe('16h')
    })

    it('returns the expected result if resolution is set to minutes', () => {
      expect(formatDuration(duration1, { resolution: 'minutes' })).toBe('5h 13m')
      expect(formatDuration(duration2, { resolution: 'minutes' })).toBe('58m')
      expect(formatDuration(duration3, { resolution: 'minutes' })).toBe('15h 33m')
    })

    it('returns the expected result if resolution is set to seconds', () => {
      expect(formatDuration(duration1, { resolution: 'seconds' })).toBe('5h 13m 12s')
      expect(formatDuration(duration2, { resolution: 'seconds' })).toBe('58m 16s')
      expect(formatDuration(duration3, { resolution: 'seconds' })).toBe('15h 32m 58s')
    })

    it('returns the expected result if resolution is set to milliseconds', () => {
      expect(formatDuration(duration1, { resolution: 'milliseconds' })).toBe('5h 13m 12s 124ms')
      expect(formatDuration(duration2, { resolution: 'milliseconds' })).toBe('58m 15s 662ms')
      expect(formatDuration(duration3, { resolution: 'milliseconds' })).toBe('15h 32m 58s 10ms')
    })
  })
})
