const uuid = require('uuid/v1')
const extractObjects = require('./comment-objects/extract.js')
const parseObjects = require('./comment-objects/parse.js')
const chalk = require('chalk')

module.exports = function (config, Storage) {

  /*=======================*\
  ||         Punch         ||
  \*=======================*/

  class Punch {
    /*
      id: string
      project: string
      in: Date
      out?: Date
      comments: Comment[]
      rate: number
      created: Date
      updated: Date
    */

    constructor (props) {
      if (typeof props !== 'object' || Array.isArray(props)) {
        throw new Error('The only argument to the Punch constructor should be an object. Received ' + typeof props)
      }
      if (typeof props.project !== 'string') {
        throw new Error('Punch requires a "project" field (string) to be specified in the props object.')
      }

      this.id = props.id || uuid()
      this.project = props.project
      this.in = new Date(props.in || new Date())
      this.out = props.out ? new Date(props.out || new Date()) : null
      this.comments = props.comments
        ? props.comments.map(c => new Comment(c.comment || c, c.timestamp))
        : []
      if (props.rate) {
        this.rate = props.rate
      } else if (config.projects[props.project]) {
        this.rate = config.projects[props.project].hourlyRate || 0
      } else {
        this.rate = 0
      }

      if (this.out && this.out < this.in) {
        const formatDate = require('date-fns/format')
        const format = 'MMM Do YYYY [at] h:mm:ss A'
        const inTime = formatDate(this.in, format)
        const outTime = formatDate(this.out, format)
        throw new Error(`Punch out occurs before punch in. Project: ${this.project}, in: ${inTime}, out: ${outTime}`)
      }

      this.created = new Date(props.created || new Date())
      this.updated = new Date(props.updated || new Date())
    }

    addComment (comment) {
      this.comments.push(new Comment(comment))

      this.update()
    }

    punchOut (comment, options = {}) {
      this.out = options.time || new Date()
      
      this.update()

      if (comment) this.addComment(comment)
      if (options.autosave) this.save()
    }

    duration () {
      return (this.out || new Date()).getTime() - this.in
    }

    pay () {
      // Hours * hourlyRate
      return this.duration() / 3600000 * this.rate
    }

    durationWithinInterval (interval) {
      let start = Math.max(this.in, interval.start)
      let end = Math.min(this.out || Date.now(), interval.end)

      return end - start
    }

    payWithinInterval (interval) {
      return this.durationWithinInterval(interval) / 3600000 * this.rate
    }

    hasCommentWithObject (obj) {
      for (var i = 0; i < this.comments.length; i++) {
        if (this.comments[i].hasObject(obj)) {
          return true
        }
      }
      return false
    }

    toJSON (pretty = false) {
      const json = {
        id: this.id,
        project: this.project,
        in: this.in.getTime(),
        out: this.out ? this.out.getTime() : null,
        rate: this.rate,
        comments: this.comments.map(comment => comment.toJSON(pretty)),
        created: this.created.getTime(),
        updated: this.updated.getTime()
      }
      return json
    }

    update () {
      this.updated = new Date()
    }

    async save () {
      return storage.save(this)
    }
  }

  // Gotta love that function scope.
  // Can't put it above the class because classes can't be referenced
  // before being defined, but it's used within the class.
  var storage = Storage(config, Punch)

  /*=======================*\
  ||        Static         ||
  \*=======================*/

  Punch.current = async function (project) {
    return storage.current(project)
  }

  Punch.latest = async function () {
    return storage.latest()
  }

  Punch.select = async function (test) {
    return storage.select(test)
  }

  Punch.all = async function () {
    return storage.select(() => true)
  }

  /*=======================*\
  ||       Comments        ||
  \*=======================*/

  class Comment {
    constructor (comment, timestamp = new Date()) {
      const extracted = extractObjects(comment)
      this.objects = parseObjects(extracted.objects)
      this.comment = extracted.comment
      this.timestamp = new Date(timestamp)
    }

    hasObject (obj) {
      if (obj[0] === '@') {
        obj = obj.slice(1)
      }
      const [key, val] = obj.split(':')
      for (let i = 0; i < this.objects.length; i++) {
        const o = this.objects[i]
        if (o.key === key && o.value.toString() === val) {
          return true
        }
      }
      return false
    }

    toString () {
      let comment = this.comment
      if (this.objects.length > 0) {
        comment += ' ' + chalk.green(this.objects.map(o => o.toLogString()).join(' '))
      }
      return comment
    }

    objects () {
      return this.objects
    }

    toJSON (pretty = false) {
      let comment = this.comment
      if (this.objects.length > 0) {
        comment += ' ' + this.objects.map(o => o.toString()).join(' ')
      }

      return {
        comment,
        timestamp: this.timestamp.getTime()
      }
    }
  }

  return Punch
}
