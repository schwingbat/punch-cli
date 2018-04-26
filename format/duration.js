module.exports = function formatDuration (duration, opts = {}) {
  let out = []

  const {
    hours,
    minutes,
    seconds,
    milliseconds
  } = duration.shiftTo('hours', 'minutes', 'seconds', 'milliseconds')

  if (seconds > 0 || minutes > 0 || hours > 0) {
    let val = seconds
    if (opts.padded) val = seconds.toString().padStart(2)
    out.push(val + (opts.long ? ' seconds' : 's'))
  }

  if (minutes > 0 || hours > 0) {
    let val = minutes
    if (opts.padded) val = minutes.toString().padStart(2)
    out.push(val + (opts.long ? ' minutes' : 'm'))
  }

  if (hours > 0) {
    out.push(hours + (opts.long ? ' hours' : 'h'))
  }

  if (seconds === 0 && minutes === 0 && hours === 0) {
    out.push(milliseconds + (opts.long ? ' milliseconds' : 'ms'))
  }

  return out.reverse().join(' ')
}
