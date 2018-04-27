module.exports = function formatDuration (milliseconds, opts = {}) {
  let out = []

  let hours = milliseconds / 3600000
  let minutes = 0
  let seconds = 0
  let remainder = hours - ~~hours

  hours = ~~hours
  minutes = remainder * 60
  remainder = minutes - ~~minutes
  minutes = ~~minutes
  seconds = remainder * 60
  remainder = seconds - ~~seconds
  seconds = ~~seconds
  milliseconds = ~~(remainder * 1000)

  if (opts.style === 'clock') {
    const h = hours.toString().padStart(2, '0')
    const m = minutes.toString().padStart(2, '0')
    const s = seconds.toString().padStart(2, '0')

    return `${h}:${m}:${s}`
  } else {
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
}
