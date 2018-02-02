// Formatter for all the things

const formatCurrency = require('format-currency');
const moment = require('moment');

/*================*\
||     Money      ||
\*================*/

const currencyOptions = { format: '%s%v', symbol: '$' };

exports.currency = function currency(value, options = {}) {
  return formatCurrency(value, Object.assign({}, currencyOptions, options));
}

/*================*\
||      Time      ||
\*================*/

exports.duration = function duration(ms, opts = {}) {
  let out = [];
  let seconds = ms / 1000;
  let minutes = seconds / 60;
  let hours = minutes / 60;

  if (minutes >= 1) {
    seconds -= 60 * ~~minutes;
  }

  if (hours >= 1) {
    minutes -= 60 * ~~hours;
  }

  if (hours >= 1) {
    out.push(~~hours + (opts.long ? ` hour${~~hours == 1 ? '' : 's'}` : 'h') + (opts.long && (minutes >= 1 || seconds >= 1) ? ',' : ''));
  }

  if (minutes >= 1) {
    out.push(~~minutes + (opts.long ? ` minute${~~minutes == 1 ? '' : 's'}` : 'm'));
  }

  if (seconds >= 1) {
    if (opts.long && out.length > 0) {
      out.push('and');
    }
    out.push(~~seconds + (opts.long ? ` second${~~minutes == 1 ? '' : 's'}` : 's'));
  }

  return out.join(' ');
}

exports.date = time => moment(time).format('MMM Do YYYY');
exports.time = time => moment(time).format('h[:]mm A');
exports.dateTime = time => moment(time).format('MMM Do YYYY h[:]mm A');