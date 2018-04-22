const fs = require('fs')
const path = require('path')
const { descendingBy } = require('../utils/sort-factories')

module.exports = function (config) {
  class Punch {
    constructor (project, inTime = Date.now(), outTime = null, comments = []) {
      this.project = project
      this.in = new Date(inTime)
      this.out = outTime ? new Date(outTime) : null
      this.comments = comments.map(c => new Comment(c.comment || c, c.timestamp))

      if (config.projects[project]) {
        this.rate = config.projects[project].hourlyRate || 0
      } else {
        this.rate = 0
      }
    }

    addComment (comment) {
      this.comments.push(new Comment(comment))
    }

    punchOut (comment, options = {}) {
      if (comment) {
        this.addComment(comment)
      }

      this.out = options.time || new Date()

      if (options.autosave) {
        this.save()
      }
    }

    toJSON () {
      return {
        project: this.project,
        in: this.in.getTime(),
        out: this.out ? this.out.getTime() : null,
        rate: this.rate,
        comments: this.comments.map(c => c.toJSON())
      }
    }

    save () {
      const file = Punchfile.forDate(new Date(this.in))
      const existing = file.punches.find(p =>
        p.in.getTime() === this.in.getTime() && p.project === this.project)

      if (existing) {
        file.punches.splice(file.punches.indexOf(existing), 1)
      }

      file.punches.push(this)
      file.save()
    }
  }

  Punch.current = function (project) {
    const file = Punchfile.mostRecent()
    return file.punches.find(p => p.out == null && (!project || p.project === project))
  }

  Punch.latest = function () {
    const file = Punchfile.mostRecent()
    return file.punches.sort(descendingBy('in'))[0]
  }

  Punch.select = function (test) {
    let selected = []

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

  Punch.all = function () {
    return this.select(() => true)
  }

  class Comment {
    constructor (comment, timestamp = Date.now()) {
      this.comment = comment
      this.timestamp = new Date(timestamp)
    }

    toString () {
      return this.comment
    }

    toJSON () {
      return {
        comment: this.comment,
        timestamp: this.timestamp.getTime()
      }
    }
  }

  class Punchfile {
    constructor (props = {}) {
      this.version = props.version || 3
      this.created = new Date(props.created || props.updated || new Date())
      this.updated = new Date(props.updated || new Date())
      this.punches = []

      if (props.punches) {
        this.punches = props.punches.map(p => {
          return new Punch(p.project, p.in, p.out, p.comments)
        })
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
      const outPath = path.join(config.punchPath, `${this.fileName}.json`)
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
      throw new Error(`Failed to read file from ${filePath}: ${err.message}`)
    }
  }

  Punchfile.readOrCreate = function (filePath) {
    try {
      return this.read(filePath)
    } catch (err) {
      return new Punchfile()
    }
  }

  Punchfile.mostRecent = function () {
    const dateString = fileName => {
      const [y, m, d] = fileName.split(/[_\.]/g).slice(1, 4).map(n => n.padStart(4))
      return `${y}_${m}_${d}`
    }

    const latest = fs.readdirSync(config.punchPath).sort((a, b) => {
      return dateString(a) < dateString(b) ? -1 : 1
    }).pop()

    return Punchfile.read(path.join(config.punchPath, latest))
  }

  Punchfile.forDate = function (date = new Date()) {
    const y = date.getFullYear()
    const m = date.getMonth() + 1
    const d = date.getDate()

    const fileName = `punch_${y}_${m}_${d}.json`

    return this.readOrCreate(path.join(config.punchPath, fileName))
  }

  Punchfile.all = function () {
    // Loads all punch files into an array and returns it.
    const files = fs.readdirSync(config.punchPath)
      .filter(f => path.extname(f).toLowerCase() === '.json')
      .map(f => path.join(config.punchPath, f))

    return files.map(this.read)
  }

  Punchfile.each = function (func) {
    // Runs a given function on each punchfile, continuing by calling the next() function.
    // Similar to Punchfile.all, but only loads one punchfile at a time.
    const files = fs.readdirSync(config.punchPath)
      .filter(f => path.extname(f).toLowerCase() === '.json')
      .map(f => path.join(config.punchPath, f))
    let index = -1

    const next = () => {
      index += 1
      if (files[index]) {
        const read = this.read(files[index])
        func(read, next)
      }
    }

    next()
  }

  return Punch
}
