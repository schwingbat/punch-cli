module.exports = function formatDuration (milliseconds, opts = {}) {
  let resolution = resolutions[opts.resolution]
  if (resolution == null) { resolution = 1 }

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
  milliseconds = Math.round(remainder * 1000)

  if (resolution > 0) {
    seconds += Math.round(milliseconds / 1000)
  }
  if (resolution > 1) {
    minutes += Math.round(seconds / 60)
  }
  if (resolution > 2) {
    hours += Math.round(minutes / 60)
  }

  const parts = {}

  if (resolution <= resolutions.hours) {
    if (resolution === resolutions.hours || hours > 0) {
      parts.hours = hours
    }
  }
  if (resolution <= resolutions.minutes) {
    if (resolution === resolutions.minutes || minutes > 0 || hours > 0) {
      parts.minutes = minutes
    }
  }
  if (resolution <= resolutions.seconds) {
    if (resolution === resolutions.seconds || seconds > 0 || minutes > 0 || hours > 0) {
      parts.seconds = seconds
    }
  }
  if (resolution <= resolutions.milliseconds) {
    if (resolution === resolutions.milliseconds || milliseconds > 0 || seconds > 0 || minutes > 0 || hours > 0) {
      parts.milliseconds = milliseconds
    }
  }

  if (opts.style === 'clock') {
    const h = (parts.hours || 0).toString().padStart(2, '0')
    const m = (parts.minutes || 0).toString().padStart(2, '0')
    const s = (parts.seconds || 0).toString().padStart(2, '0')

    return `${h}:${m}:${s}`
  } else {
    let out = []

    if ('hours' in parts) {
      out.push(parts.hours + (opts.long ? ' hours' : 'h'))
    }

    if ('minutes' in parts) {
      out.push(parts.minutes + (opts.long ? ' minutes' : 'm'))
    }

    if ('seconds' in parts) {
      out.push(parts.seconds + (opts.long ? ' seconds' : 's'))
    }

    if ('milliseconds' in parts) {
      out.push(parts.milliseconds + (opts.long ? ' milliseconds' : 'ms'))
    }

    if (opts.long) {
      let str = ''
      out.forEach((part, i) => {
        str += part
        if (i + 2 === out.length) {
          str += ' and '
        } else if (i + 1 < out.length) {
          str += ', '
        }
      })
      return str
    } else {
      return out.join(' ')
    }
  }
}

const resolutions = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,

  ms: 0,
  millisecond: 0,
  milliseconds: 0,

  second: 1,
  seconds: 1,

  minute: 2,
  minutes: 2,

  hour: 3,
  hours: 3
}
