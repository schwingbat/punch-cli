// Functions for reading and writing to punch files.
const fs = require('fs')
const path = require('path')
const SQLish = require('./sqlish')

module.exports = function(config) {

  function Punchfile(props = {}) {
    this.created = new Date(props.created || props.updated || new Date())
    this.updated = new Date(props.updated || new Date())
    this.punches = []

    if (props.punches) {
      this.punches = props.punches.map(p => {
        if (p.in) p.in = new Date(p.in)
        if (p.out) p.out = new Date(p.out)
        p._file = this
        return p
      })
    }

    const y = this.created.getFullYear()
    const m = this.created.getMonth() + 1
    const d = this.created.getDate()

    this.fileName = `punch_${y}_${m}_${d}`
  }

  Punchfile.prototype = {
    update() {
      this.updated = new Date()
    },
    addPunch(punch) {
      // Adds a new punch, expecting a full set of data to be passed as an object.

      const comments = Array.isArray(punch.comments)
        ? punch.comments
        : [punch.comments]

      this.punches.push({
        project: punch.project,
        in: new Date(punch.in),
        out: new Date(punch.out),
        comments,
        rewind: punch.rewind || 0,
      })

      this.update()
    },
    punchIn(project) {
      // Add a fresh punch punched in at the current time.

      this.punches.push({
        project,
        in: new Date(),
        out: null,
        comments: [],
        rewind: 0
      })

      this.update()
    },
    punchOut(project) {
      // Find most recent punch in with matching project name.

      const punch = this.punches
        .filter(p => !p.out || p.project !== project)
        .sort((a, b) => a.in < b.in)[0]

      if (punch) {
        punch.out = new Date()
        this.update()
      } else {
        throw new Error('No punches with that project name are currently missing a punch out')
      }
    },
    mostRecentPunch(project) {
      let punches = this.punches.map(p => p)

      if (project) {
        punches = punches.filter(p => p.project === project)
      }

      return punches.sort((a, b) => a.in > b.in).pop()
    },
    toJSON(pretty = false) {
      const obj = {
        created: this.created.getTime(),
        updated: this.updated.getTime(),
        punches: this.punches.map(p => {
          return {
            project: p.project,
            in: p.in ? p.in.getTime() : null,
            out: p.out ? p.out.getTime() : null,
            rewind: p.rewind || 0,
            comments: p.comment ? [p.comment] : p.comments.filter(c => c),
          }
        }),
      }

      if (pretty) {
        return JSON.stringify(obj, null, 2)
      } else {
        return JSON.stringify(obj)
      }
    },
    save() {
      this.update()
      const outPath = path.join(config.punchPath, `${this.fileName}.json`)
      return fs.writeFileSync(outPath, this.toJSON(true))
    }
  }

  Punchfile.read = function(filePath) {
    // Reads a file and returns a new Punchfile object using the result.
    const p = path.resolve(filePath)

    try {
      const file = fs.readFileSync(p)
      const data = JSON.parse(file)
      return new Punchfile(data)
    } catch (err) {
      throw new Error(`Failed to read file from ${filePath}: ${err.message}`)
    }
  }

  Punchfile.readOrCreate = function(filePath) {
    try {
      return this.read(filePath)
    } catch (err) {
      return new Punchfile()
    }
  }

  Punchfile.mostRecent = function() {
    const dateString = fileName => {
      const [y, m, d] = fileName.split(/[_\.]/g).slice(1, 4).map(n => n.padStart(4))
      return `${y}_${m}_${d}`
    }

    const latest = fs.readdirSync(config.punchPath).sort((a, b) => {
      return dateString(a) < dateString(b) ? -1 : 1
    }).pop()

    return Punchfile.read(path.join(config.punchPath, latest))
  }

  Punchfile.forDate = function(date = new Date()) {
    const y = date.getFullYear()
    const m = date.getMonth() + 1
    const d = date.getDate()

    const fileName = `punch_${y}_${m}_${d}.json`

    return this.readOrCreate(path.join(config.punchPath, fileName))
  }

  Punchfile.all = function() {
    // Loads all punch files into an array and returns it.
    const files = fs.readdirSync(config.punchPath)
      .filter(f => path.extname(f).toLowerCase() === '.json')
      .map(f => path.join(config.punchPath, f))

    return files.map(this.read)
  }

  Punchfile.each = function(func) {
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

  Punchfile.select = function(props) {
    return SQLish(config, {})
      .select(props)
      .from('punchfiles')
  }

  return Punchfile
}
