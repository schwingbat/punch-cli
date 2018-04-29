/*
  Takes a fuzzy string like "two days ago" or "last wednesday"
  and makes it into a useful Interval.
*/

const {
  startOfDay,
  endOfDay,
  addDays,
  startOfWeek,
  endOfWeek,
  addWeeks,
  startOfMonth,
  endOfMonth,
  addMonths,
  startOfYear,
  endOfYear,
  addYears
} = require('date-fns')

module.exports = function (string, now = new Date()) {
  let parts = string.toLowerCase().split(/\s+/)

  let start
  let end
  let unit
  let modifier

  if (['now', 'today'].includes(parts[0])) {
    unit = 'day'
    modifier = 0
    start = startOfDay(now)
    end = endOfDay(now)
  }

  if (parts[0] === 'yesterday') {
    unit = 'day'
    modifier = 1
    start = startOfDay(addDays(now, -1))
    end = endOfDay(addDays(now, -1))
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
        start = startOfDay(addDays(now, modifier))
        end = endOfDay(addDays(now, modifier))
      } else if (unit === 'week') {
        start = startOfWeek(addWeeks(now, modifier))
        end = endOfWeek(addWeeks(now, modifier))
      } else if (unit === 'month') {
        start = startOfMonth(addMonths(now, modifier))
        end = endOfMonth(addMonths(now, modifier))
      } else if (unit === 'year') {
        start = startOfYear(addYears(now, modifier))
        end = endOfYear(addYears(now, modifier))
      } else if (weekdays.includes(unit)) {
        let dayIndex = weekdays.indexOf(unit)
        start = startOfDay(now)
        while (start.getDay() !== dayIndex) {
          start = addDays(start, -1)
        }
        end = endOfDay(start)
      } else if (months.includes(unit)) {
        let monthIndex = months.indexOf(unit)
        start = startOfMonth(now)
        while (start.getMonth() !== monthIndex) {
          start = addMonths(start, -1)
        }
        end = endOfMonth(start)
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
      return { start, end }
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
