module.exports = function formatDuration (milliseconds, opts = {}) {
  let resolution = resolutions[opts.resolution]
  let padded = opts.padded || false
  if (resolution == null) { resolution = 1 }

  if (opts.fractional) {
    if (resolution === resolutions.hour) {
      return (milliseconds / 3600000).toFixed(1) + (opts.long ? ' hours' : 'h')
    } else if (resolution === resolutions.minute) {
      return (milliseconds / 60000).toFixed(1) + (opts.long ? ' minutes' : 'm')
    } else if (resolution === resolutions.second) {
      return (milliseconds / 1000).toFixed(1) + (opts.long ? ' seconds' : 's')
    }
  }

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
      let hourString = parts.hours.toString()
      
      // Add commas
      if (hourString.length > 3) {
        const chars = []
        const rev = hourString.split('').reverse()
        for (let i = 0; i < rev.length; i++) {
          chars.push(rev[i])
          if (i !== 0 && i !== rev.length - 1 && (i + 1) % 3=== 0) {
            chars.push(',')
          }
        }
        hourString = chars.reverse().join('')
      }

      let hours = hourString + (opts.long ? ' hours' : 'h')
      out.push(hours)
    }

    if ('minutes' in parts) {
      let minutes = parts.minutes + (opts.long ? ' minutes' : 'm')
      if (padded && 'hours' in parts) {
        minutes = minutes.padStart(3)
      }
      out.push(minutes)
    }

    if ('seconds' in parts) {
      let seconds = parts.seconds + (opts.long ? ' seconds' : 's')
      if (padded && ('minutes' in parts || 'hours' in parts)) {
        seconds = seconds.padStart(3)
      }
      out.push(seconds)
    }

    if ('milliseconds' in parts) {
      let milliseconds = parts.milliseconds + (opts.long ? ' milliseconds' : 'ms')
      out.push(milliseconds)
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
