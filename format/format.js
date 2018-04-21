// Formatter for all the things

const moment = require('moment')
const config = require('../config')

exports.clock = time => {
  const duration = moment.duration(time)
  const hours = duration.hours().toString().padStart(2, '0')
  const minutes = duration.minutes().toString().padStart(2, '0')
  const seconds = duration.seconds().toString().padStart(2, '0')

  let str = ''

  if (duration.hours() > 0) {
    str += hours + ':'
  }

  return str + `${minutes}:${seconds}`
}

exports.date = time => moment(time).format('MMM Do YYYY')
exports.time = time => moment(time).format('h[:]mm A')
exports.dateTime = time => moment(time).format('MMM Do YYYY h[:]mm A')