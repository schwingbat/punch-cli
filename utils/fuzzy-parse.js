/*
  Takes a fuzzy string like "two days ago" or "last wednesday"
  and makes it into a useful Interval.
*/

const startOfDay = require('date-fns/start_of_day')
const endOfDay = require('date-fns/end_of_day')
const addDays = require('date-fns/add_days')
const differenceInDays = require('date-fns/difference_in_days')
const startOfWeek = require('date-fns/start_of_week')
const endOfWeek = require('date-fns/end_of_week')
const addWeeks = require('date-fns/add_weeks')
const startOfMonth = require('date-fns/start_of_month')
const endOfMonth = require('date-fns/end_of_month')
const addMonths = require('date-fns/add_months')
const startOfYear = require('date-fns/start_of_year')
const endOfYear = require('date-fns/end_of_year')
const addYears = require('date-fns/add_years')

const parseDate = require('./parse-date')

module.exports = function (string, opts = {}) {
  const { now, pastTendency } = Object.assign({
    now: new Date(),
    pastTendency: true
  }, opts)

  let start
  let end
  let unit
  let modifier

  const parsed = parseDate(string)
  if (parsed) {
    start = startOfDay(parsed)
    end = endOfDay(parsed)
    unit = 'day'
    modifier = differenceInDays(start, now)
  } else {
    let parts = string.toLowerCase().split(/\s+/)

    if (['now', 'today'].includes(parts[0])) {
      unit = 'day'
      modifier = 0
      start = startOfDay(now)
      end = endOfDay(now)
    }

    if (parts[0] === 'yesterday') {
      unit = 'day'
      modifier = -1
      start = startOfDay(addDays(now, -1))
      end = endOfDay(addDays(now, -1))
    }

    if (parts[0] === 'tomorrow') {
      unit = 'day'
      modifier = 1
      start = startOfDay(addDays(now, 1))
      end = endOfDay(start)
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
        modifier = numbers.indexOf(first)
        if (pastTendency) {
          modifier *= -1
        }
      } else if (weekdays.includes(first) || months.includes(first)) {
        modifier = pastTendency ? -1 : 1
        unit = first
      } else if (/^\d{4,}$/.test(first)) {
        modifier = pastTendency
          ? parseInt(first) - now.getFullYear()
          : now.getFullYear() - parseInt(first)
        unit = 'year'
      } else if (parseInt(first)) {
        modifier = parseInt(first) || 0
        if (pastTendency) {
          modifier *= -1
        }
      } else {
        unit = parts[0]
      }

      // console.log({ string, unit, modifier })

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
        } else if (/^\d+$/.test(unit)) {
          start = new Date(Number(unit))
          end = endOfYear(start)
          unit = 'year'
        } else if (weekdays.includes(unit)) {
          let dayIndex = weekdays.indexOf(unit)
          let distance = 0
          start = startOfDay(now)
          while (start.getDay() !== dayIndex) {
            start = addDays(start, modifier)
            distance += modifier
          }
          end = endOfDay(start)
          unit = 'day'
          modifier = distance
        } else if (months.includes(unit)) {
          let monthIndex = months.indexOf(unit)
          let distance = 0
          start = startOfMonth(now)
          while (start.getMonth() !== monthIndex) {
            start = addMonths(start, modifier)
            distance += modifier
          }
          end = endOfMonth(start)
          unit = 'month'
          modifier = distance
        }
      }
    }
  }

  // console.log({
  //   start,
  //   end,
  //   unit: unit || '???',
  //   modifier: modifier || 0
  // })

  return {
    start,
    end,
    unit: unit || '???',
    modifier: modifier || 0
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
