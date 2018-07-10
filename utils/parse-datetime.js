const parseDate = require('./parse-date')

const timePattern = /^(\d+)[:](\d+)[:]?(\d*)\s*([ap]m)?$/i
const datePattern = parseDate.pattern

function parseTime (timeString) {
  let hours
  let minutes
  let seconds
  let meridian

  if (timePattern.test(timeString.trim())) {
    let parts = timeString.trim().match(timePattern)
    hours = Number(parts[1])
    minutes = Number(parts[2])
    seconds = Number(parts[3])
    meridian = parts[4]
  } else {
    throw new Error('Time is not in a compatible format: use either 12-hour with AM/PM or 24-hour format for time')
  }

  if (meridian && meridian.toUpperCase() === 'PM') {
    if (hours <= 11) {
      hours += 12
    } else if (hours > 12) {
      throw new Error('Hours should not be greater than 12 when PM is present.')
    }
  }

  return [hours, minutes, seconds]
}

module.exports = function (str) {
  if (str.indexOf('@') === -1) {
    if (timePattern.test(str.trim())) {
      // Check if it's just a time
      const date = new Date()
      date.setHours(...parseTime(str))
      return date
    } else if (datePattern.test(str.trim())) {
      // Just a date?
      const parsed = parseDate(str)
      if (parsed) {
        return parsed
      } else {
        throw new Error('Datetime string should be in the format DATE@TIME[AM/PM]')
      }
    }
  }

  const [dateString, timeString] = str.split('@').map(s => s.trim())

  const date = parseDate(dateString)
  if (!date) {
    throw new Error('Failed to parse date part of datetime string')
  }

  // Date is parsed. Figure out time.
  const [hours, minutes, seconds] = parseTime(timeString)
  date.setHours(hours, minutes, seconds)

  return date
}
