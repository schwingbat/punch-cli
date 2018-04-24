class Duration {
  constructor (ms = 0) {
    if (ms instanceof Duration) {
      this._ms = ms._ms || 0
    } else {
      this._ms = ms
    }
  }

  totalHours () {
    return this._ms / 3600000
  }

  totalMinutes () {
    return this._ms / 60000
  }

  totalSeconds () {
    return this._ms / 1000
  }

  totalMilliseconds () {
    return this._ms
  }

  hours () {
    return Math.trunc(this.totalHours())
  }

  minutes () {
    return Math.trunc(this.totalMinutes()) - this.hours() * 60
  }

  seconds () {
    return Math.trunc(this.totalSeconds()) - (this.hours() * 3600) - (this.minutes() * 60)
  }

  milliseconds () {
    return this._ms - (this.hours() * 3600000) - (this.minutes() * 60000) - (this.seconds() * 1000)
  }

  sumTimeObject (obj) {
    let time = 0

    if (obj.ms || obj.milliseconds) {
      time += obj.ms || obj.milliseconds || 0
    }

    if (obj.seconds) {
      time += obj.seconds * 1000
    }

    if (obj.minutes) {
      time += obj.minutes * 60000
    }

    if (obj.hours) {
      time += obj.hours * 3600000
    }

    return time
  }

  plus (obj) {
    if (obj instanceof Duration) {
      return new Duration(this._ms + obj._ms)
    } else {
      return new Duration(this._ms + this.sumTimeObject(obj))
    }
  }

  minus (obj) {
    if (obj instanceof Duration) {
      return new Duration(this._ms - obj._ms)
    } else {
      return new Duration(this._ms - this.sumTimeObject(obj))
    }
  }

  toString (opts = {}) {
    let out = []
    let hours = this.hours()
    let minutes = this.minutes()
    let seconds = this.seconds()

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
      out.push(this.totalMilliseconds() + (opts.long ? ' milliseconds' : 'ms'))
    }

    return out.reverse().join(' ')
  }

  toClockString () {
    return this.hours() + ':' + this.minutes().toString().padStart(2, '0') + ':' + this.seconds().toString().padStart(2, '0')
  }
}

Duration.parse = function (str) {
  const parts = str.split(' ').map(s => s.trim().toLowerCase())
  let ms = 0

  parts.forEach(p => {
    const [, amount, unit] = p.match(/(\d+)(\w)$/)

    switch (unit) {
    case 's':
      ms += parseInt(amount) * 1000
      break
    case 'm':
      ms += parseInt(amount) * 1000 * 60
      break
    case 'h':
      ms += parseInt(amount) * 1000 * 60 * 60
      break
    }
  })

  return new Duration(ms)
}

module.exports = Duration
