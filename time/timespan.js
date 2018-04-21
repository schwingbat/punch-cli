const moment = require('moment')
const Duration = require('./duration')

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

class TimeSpan {
  constructor (start = Date.now(), end = Date.now()) {
    this.start = start
    this.end = end
  }

  sumTimeObject (obj) {
    let sum = 0

    if (obj.ms || obj.milliseconds) {
      sum += obj.ms || obj.milliseconds
    }

    if (obj.seconds) {
      sum += obj.seconds * 1000
    }

    if (obj.minutes) {
      sum += obj.minutes * 60000
    }

    if (obj.hours) {
      sum += obj.hours * 3600000
    }

    return sum
  }

  plus (props) {
    return new TimeSpan(this.start, this.end + this.sumTimeObject(props))
  }

  minus (props) {
    return new TimeSpan(this.start, this.end - this.sumTimeObject(props))
  }

  totalHours () {
    return this.duration().totalHours()
  }

  duration () {
    return new Duration(this.end - this.start)
  }
}

TimeSpan.fuzzyParse = function (string) {
  let modifier = 0
  let parts = string.toLowerCase().split(/\s+/)

  if (['now', 'today'].includes(parts[0])) {
    let day = moment()
    return new TimeSpan(day.startOf('day').valueOf(), day.endOf('day').valueOf())
  }

  if (parts[0] === 'yesterday') {
    let day = moment().subtract(1, 'day')
    console.log(day)
    return new TimeSpan(day.startOf('day').valueOf(), day.endOf('day').valueOf())
  }

  let first = parts[0]
  let unit = parts[1]
  if (first === 'this') {
    modifier = 0
  } else if (first === 'last') {
    modifier = 1
  } else if (numbers.includes(first)) {
    modifier = numbers.indexOf(first)
  } else if (weekdays.includes(first) || months.includes(first)) {
    modifier = 1
  } else if (parseInt(first)) {
    modifier = parseInt(first) || 0
  } else {
    unit = parts[0]
  }

  if (modifier === 0 && parts[2] === 'ago') {
    console.log('Sorry, I\'m not quite sure when you mean.')
  } else {
    if (unit === 'day' || unit === 'days') {
      let start = moment().subtract(modifier, 'days').startOf('day')
      return new TimeSpan(start.valueOf(), start.endOf('day').valueOf())

    } else if (unit === 'month' || unit === 'months') {
      let start = moment().subtract(modifier, 'month').startOf('month')
      return new TimeSpan(start.valueOf(), start.endOf('month').valueOf())

    } else if (unit === 'week' || unit === 'weeks') {
      let start = moment().subtract(modifier, 'week').startOf('week')
      return new TimeSpan(start.valueOf(), start.endOf('week').valueOf())

    } else if (unit === 'year' || unit === 'years') {
      let start = moment().subtract(modifier, 'year').startOf('year')
      return new TimeSpan(start.valueOf(), start.endOf('year').valueOf())

    } else if (weekdays.includes(unit)) {
      let dayIndex = weekdays.indexOf(unit)
      let start = moment()
      while (start.day() !== dayIndex) {
        start.subtract(1, 'day')
      }
      start = start.startOf('day')
      return new TimeSpan(start.valueOf(), start.endOf('day').valueOf())

    } else if (months.includes(unit)) {
      let monthIndex = months.indexOf(unit)
      let start = moment()
      while (start.month() !== monthIndex) {
        start.subtract(1, 'month')
      }
      start = start.startOf('month')
      return new TimeSpan(start.valueOf(), start.endOf('month').valueOf())
    } else {
      console.log('Sorry, I\'m not quite sure when you mean.')
    }
  }
}

module.exports = TimeSpan