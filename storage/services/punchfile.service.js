module.exports = function (config, Punch) {
  const fs = require('fs')
  const path = require('path')
  const chalk = require('chalk')
  const mkdirp = require('mkdirp')

  // Make sure path exists if we're using the service.
  if (!fs.existsSync(config.punchFilePath)) {
    mkdirp.sync(config.punchFilePath)
  }

  class Punchfile {
    constructor (props = {}) {
      this.version = props.version || 3
      this.created = new Date(props.created || props.updated || new Date())
      this.updated = new Date(props.updated || new Date())
      this.punches = []

      if (props.punches) {
        this.punches = props.punches.map(p => new Punch(p)).sort((a, b) => a.in > b.in)
      }

      const y = this.created.getFullYear()
      const m = this.created.getMonth() + 1
      const d = this.created.getDate()

      this.fileName = `punch_${y}_${m}_${d}`
    }

    update () {
      this.updated = new Date()
    }

    toJSON (pretty = false) {
      const obj = {
        version: this.version,
        created: this.created.getTime(),
        updated: this.updated.getTime(),
        punches: this.punches.map(p => p.toJSON())
      }

      return JSON.stringify(obj, null, pretty ? 2 : null)
    }

    save () {
      this.update()
      const outPath = path.join(config.punchFilePath, `${this.fileName}.json`)
      return fs.writeFileSync(outPath, this.toJSON(true))
    }
  }

  Punchfile.read = function (filePath) {
    // Reads a file and returns a new Punchfile object using the result.

    try {
      const p = path.resolve(filePath)
      const data = JSON.parse(fs.readFileSync(p))
      return new Punchfile(data)
    } catch (err) {
      throw new Error(`Failed to read ${filePath} (${err.message})`)
    }
  }

  Punchfile.readOrCreate = function (filePath) {
    try {
      return this.read(filePath)
    } catch (err) {
      const [y, m, d] = filePath.match(/punch_(\d+)_(\d+)_(\d+)\.json$/).slice(1, 4).map(Number)
      const date = new Date(y, m - 1, d)
      if (date.toString() === 'Invalid Date') {
        throw new Error('Failed to parse date from filename: ' + filePath)
      } else {
        return new Punchfile({
          created: date
        })
      }
    }
  }

  Punchfile.mostRecent = function () {
    const dateString = fileName => {
      const [y, m, d] = fileName.split(/[_\.]/g).slice(1, 4).map(n => n.padStart(4))
      return `${y}_${m}_${d}`
    }

    const latest = fs.readdirSync(config.punchFilePath).sort((a, b) => {
      return dateString(a) < dateString(b) ? -1 : 1
    }).pop()

    return Punchfile.read(path.join(config.punchFilePath, latest))
  }

  Punchfile.forDate = function (date = new Date()) {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()

    const fileName = `punch_${year}_${month}_${day}.json`
    return this.readOrCreate(path.join(config.punchFilePath, fileName))
  }

  Punchfile.all = function () {
    // Loads all punch files into an array and returns it.
    const files = fs.readdirSync(config.punchFilePath)
      .filter(f => path.extname(f).toLowerCase() === '.json')
      .map(f => path.join(config.punchFilePath, f))

    return files.map(this.read)
  }

  Punchfile.each = function (func) {
    // Runs a given function on each punchfile, continuing by calling the next() function.
    // Similar to Punchfile.all, but only loads one punchfile at a time.
    const files = fs.readdirSync(config.punchFilePath)
      .filter(f => path.extname(f).toLowerCase() === '.json')
      .map(f => path.join(config.punchFilePath, f))
    let index = -1

    const next = () => {
      index += 1
      if (files[index]) {
        try {
          const read = this.read(files[index])
          func(read, next)
        } catch (err) {
          console.log(chalk.yellow('Skipping file: ' + err.message))
          next()
        }
      }
    }

    next()
  }

  return {
    async save (punch) {
      const file = Punchfile.forDate(punch.in)

      let added = false
      for (let i = 0; i < file.punches.length; i++) {
        if (file.punches[i].id === punch.id) {
          file.punches[i] = punch
          added = true
        }
      }
      if (!added) file.punches.push(punch)
      return file.save()
    },

    async current (project) {
      const file = Punchfile.mostRecent()
      const latest = file.punches.pop()
      if (latest && !latest.out) {
        return latest
      }
    },

    async latest (project) {
      const file = Punchfile.mostRecent()
      if (file) {
        return file.punches.pop()
      }
    },

    async select (test) {
      const selected = []

      Punchfile.each((file, next) => {
        file.punches.forEach(punch => {
          if (test(punch)) {
            selected.push(punch)
          }
        })
        next()
      })

      return selected
    }
  }
}
