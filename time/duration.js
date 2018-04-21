class Duration {
  constructor (ms = 0) {
    this._ms = ms
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
    return Math.trunc(this.totalSeconds()) - this.minutes() * 60
  }

  milliseconds () {
    return this._ms - this.seconds() * 60
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
      this._ms += obj.ms
    } else {
      this._ms += this.sumTimeObject(obj)
    }
  }

  minus (obj) {
    if (obj instanceof Duration) {
      this._ms -= obj.ms
    } else {
      this._ms -= this.sumTimeObject(obj)
    }
  }

  toString (opts = {}) {
    let out = []
    let hours = Math.trunc(this._ms / 3600000)
    let minutes = Math.trunc(this._ms / 60000)
    let seconds = Math.trunc(this._ms / 1000)

    seconds -= (minutes * 60) || (hours * 3600)
    minutes -= hours * 60

    if (seconds > 0 || minutes > 0 || hours > 0) {
      out.push(seconds + (opts.long ? ' seconds' : 's'))
    }

    if (minutes > 0 || hours > 0) {
      out.push(minutes + (opts.long ? ' minutes' : 'm'))
    }

    if (hours > 0) {
      out.push(hours + (opts.long ? ' hours' : 'h'))
    }

    return out.reverse().join(' ')
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
