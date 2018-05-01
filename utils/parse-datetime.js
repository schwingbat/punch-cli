const parseDate = require('./parse-date')

module.exports = function (str) {
  if (str.indexOf('@') === -1) {
    throw new Error('Datetime string should be in the format DATE@TIME[AM/PM]')
  }

  const [dateString, timeString] = str.split('@').map(s => s.trim())

  const date = parseDate(dateString)
  if (!date) {
    throw new Error('Failed to parse date part of datetime string')
  }

  // Date is parsed. Figure out time.
  let timePattern = /^(\d+)[:](\d+)[:]?(\d*)\s*(.*)$/

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
    if (hours <= 12) {
      hours += 12
    } else {
      throw new Error('Hours should not be greater than 12 when PM is present.')
    }
  }
  date.setHours(hours, minutes, seconds)

  return date
}
