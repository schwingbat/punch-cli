module.exports = function formatDuration (milliseconds, opts = {}) {
  let out = []
  let resolution = resolutions[opts.resolution] || 1

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
      if (resolution <= resolutions['seconds']) {
        out.push(val + (opts.long ? ' seconds' : 's'))
      } else {
        minutes += Math.round(val / 60)
      }
    }

    if (minutes > 0 || hours > 0) {
      let val = minutes
      if (opts.padded) val = minutes.toString().padStart(2)
      if (resolution <= resolutions['minutes']) {
        out.push(val + (opts.long ? ' minutes' : 'm'))
      } else {
        hours += Math.round(val / 60)
      }
    }

    if (resolution === resolutions['hours']) {
      out.push(hours + (opts.long ? ' hours' : 'h'))
    } else {
      if (hours > 0) {
        out.push(hours + (opts.long ? ' hours' : 'h'))
      }

      if (resolution === resolutions['milliseconds']) {
        out.push(milliseconds + (opts.long ? ' milliseconds' : 'ms'))
      }
    }

    return out.reverse().join(' ')
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
