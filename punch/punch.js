const { DateTime, Duration } = require('luxon')
const uuid = require('uuid/v1')

module.exports = function (config, Storage) {
  class Punch {
    /*
      id: string
      project: string
      in: DateTime
      out?: DateTime
      comments: Comment[]
      rate: number
      created: DateTime
      updated: DateTime
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
      this.in = props.in
        ? DateTime.fromMillis(props.in)
        : DateTime.local()
      this.out = props.out
        ? DateTime.fromMillis(props.out)
        : null
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

      this.created = props.created
        ? DateTime.fromMillis(props.created)
        : DateTime.local()
      this.updated = props.updated
        ? DateTime.fromMillis(props.updated)
        : DateTime.local()
    }

    addComment (comment) {
      this.comments.push(new Comment(comment))
    }

    punchOut (comment, options = {}) {
      this.out = options.time || DateTime.local()

      if (comment) this.addComment(comment)
      if (options.autosave) this.save()
    }

    duration () {
      let out
      if (this.out) {
        out = this.out.valueOf()
      } else {
        out = Date.now()
      }

      return Duration.fromMillis(out - this.in)
    }

    toJSON () {
      return {
        id: this.id,
        project: this.project,
        in: this.in.valueOf(),
        out: this.out ? this.out.valueOf() : null,
        rate: this.rate,
        comments: this.comments.map(comment => comment.toJSON()),
        created: this.created.valueOf(),
        updated: this.updated.valueOf()
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
    constructor (comment, timestamp) {
      this.comment = comment
      this.timestamp = timestamp
        ? DateTime.fromMillis(timestamp)
        : DateTime.local()
    }

    toString () {
      return this.comment
    }

    toJSON () {
      return {
        comment: this.comment,
        timestamp: this.timestamp.valueOf()
      }
    }
  }

  return Punch
}
