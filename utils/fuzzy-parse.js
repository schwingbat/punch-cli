const { DateTime, Interval } = require('luxon')

/*
  Takes a fuzzy string like "two days ago" or "last wednesday"
  and makes it into a useful Interval.
*/

module.exports = function (string, now = DateTime.local()) {
  let parts = string.toLowerCase().split(/\s+/)

  let start
  let end
  let unit
  let modifier

  if (['now', 'today'].includes(parts[0])) {
    unit = 'day'
    modifier = 0
    start = now.startOf('day')
    end = now.endOf('day')
  }

  if (parts[0] === 'yesterday') {
    unit = 'day'
    modifier = 1
    start = now.minus({ days: 1 }).startOf('day')
    end = start.endOf('day')
  }

  if (!start || !end) {
    let first = parts[0]
    unit = parts[1]
    if (first === 'this') {
      modifier = 0
    } else if (first === 'last') {
      modifier = -1
    } else if (first === 'next') {
      modifier = 1
    } else if (numbers.includes(first)) {
      modifier = -numbers.indexOf(first)
    } else if (weekdays.includes(first) || months.includes(first)) {
      modifier = -1
    } else if (parseInt(first)) {
      modifier = -parseInt(first) || 0
    } else {
      unit = parts[0]
    }

    unit = unit.replace(/[s|ies]$/, '')

    if (!(modifier === 0 && parts[2] === 'ago')) {
      if (unit === 'day') {
        start = now.plus({ days: modifier }).startOf('day')
        end = start.endOf('day')
      } else if (unit === 'month') {
        start = now.plus({ months: modifier }).startOf('month')
        end = start.endOf('month')
      } else if (unit === 'week') {
        start = now.plus({ weeks: modifier }).startOf('week')
        end = start.endOf('week')
      } else if (unit === 'year') {
        start = now.plus({ years: modifier }).startOf('year')
        end = start.endOf('year')
      } else if (weekdays.includes(unit)) {
        let dayIndex = weekdays.indexOf(unit)
        start = now
        while (start.day !== dayIndex) {
          start = start.minus({ days: 1 })
        }
        start = start.startOf('day')
        end = start.endOf('day')
      } else if (months.includes(unit)) {
        let monthIndex = months.indexOf(unit)
        start = now
        while (start.month !== monthIndex) {
          start = start.minus({ months: 1 })
        }
        start = start.startOf('month')
        end = start.endOf('month')
      }
    }
  }

  return {
    modifier () {
      return modifier || 0
    },
    unit () {
      return unit || '???'
    },
    interval () {
      return Interval.fromDateTimes(start, end)
    }
  }
}

const numbers = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
  'twenty'
]

const months = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december'
]

const weekdays = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
]
