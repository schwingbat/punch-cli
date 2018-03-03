// Formatter for all the things

const formatCurrency = require('format-currency')
const moment = require('moment')
const chalk = require('chalk')
const config = require('../files/config')

/*================*\
||     Money      ||
\*================*/

const currencyOptions = { format: '%s%v', symbol: '$' }

exports.currency = function currency(value, options = {}) {
  return formatCurrency(value, Object.assign({}, currencyOptions, options))
}

/*================*\
||      Time      ||
\*================*/

exports.duration = function duration(ms, opts = {}) {
  let out = []
  let seconds = ms / 1000
  let minutes = seconds / 60
  let hours = minutes / 60

  if (minutes >= 1) {
    seconds -= 60 * ~~minutes
  }

  if (hours >= 1) {
    minutes -= 60 * ~~hours
  }

  if (hours >= 1) {
    out.push(~~hours + (opts.long ? ` hour${~~hours == 1 ? '' : 's'}` : 'h') + (opts.long && (minutes >= 1 || seconds >= 1) ? ',' : ''))
  }

  if (minutes >= 1) {
    out.push(~~minutes + (opts.long ? ` minute${~~minutes == 1 ? '' : 's'}` : 'm'))
  }

  if (seconds >= 1) {
    if (opts.long && out.length > 0) {
      out.push('and')
    }
    out.push(~~seconds + (opts.long ? ` second${~~minutes == 1 ? '' : 's'}` : 's'))
  }

  return out.join(' ')
}

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

exports.text = function(text, properties) {
  if (!config.textColors || !properties || properties.length === 0) {
    return text
  }

  let chalkFunction = chalk

  for (let i = 0; i < properties.length; i++) {
    chalkFunction = chalkFunction[properties[i]]
  }

  return chalkFunction(text)
}