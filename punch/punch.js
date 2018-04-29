const uuid = require('uuid/v1')

module.exports = function (config, Storage) {
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
      this.rate = props.rate
        ? props.rate
        : config.projects[props.project]
          ? config.projects[props.project].hourlyRate || 0
          : 0

      if (this.out && this.out < this.in) {
        throw new Error(`Punch out time cannot be earlier than punch in time. ${this.project} ${this.in} ${this.out}`)
      }

      this.created = new Date(props.created || new Date())
      this.updated = new Date(props.updated || new Date())
    }

    addComment (comment) {
      this.comments.push(new Comment(comment))
    }

    punchOut (comment, options = {}) {
      this.out = options.time || new Date()

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

    toJSON () {
      return {
        id: this.id,
        project: this.project,
        in: this.in.getTime(),
        out: this.out ? this.out.getTime() : null,
        rate: this.rate,
        comments: this.comments.map(comment => comment.toJSON()),
        created: this.created.getTime(),
        updated: this.updated.getTime()
      }
    }

    async save () {
      return storage.save(this)
    }
  }

  // Gotta love that function scope.
  // Can't put it above the class, but
  // it's used within the class.
  var storage = Storage(config, Punch)

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

  class Comment {
    constructor (comment, timestamp = new Date()) {
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

  return Punch
}
