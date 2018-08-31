module.exports = function (config, Punch) {
  const fs = require('fs')
  const path = require('path')
  const Database = require('better-sqlite3')

  const db = new Database(config.punchDBPath, { fileMustExist: false })

  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='punches'").get()

  if (!tableExists) {
    const schema = fs.readFileSync(path.join(appRoot, 'resources', 'sqlite-schema.sql'), 'utf8')
    db.exec(schema)
  }

  function instantiatePunch (data, comments) {
    return new Punch({
      id: data.id,
      project: data.project,
      in: data.inAt,
      out: data.outAt,
      rate: data.rate,
      comments: comments.map(c => ({
        id: c.id,
        comment: c.comment,
        timestamp: c.createdAt
      })),
      create: data.createdAt,
      updated: data.updatedAt
    })
  }

  function insertComment (data, punchID) {
    db.prepare("INSERT INTO comments (id, punchID, comment, createdAt) VALUES (?, ?, ?, ?)")
      .run(
        data.id,
        punchID,
        data.raw,
        data.timestamp.getTime())
  }

  function updateComment (data, punchID) {
    db.prepare("UPDATE comments SET comment=?, createdAt=? WHERE id = ?")
      .run(
        data.id,
        data.raw,
        data.timestamp.getTime())
  }

  function insertPunch (punch) {
    db.prepare("INSERT INTO punches (id, project, inAt, outAt, rate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(
        punch.id,
        punch.project,
        punch.in.getTime(),
        punch.out
          ? punch.out.getTime()
          : null,
        punch.rate,
        punch.created.getTime(),
        punch.updated.getTime())
    for (let comment of punch.comments) {
      if (db.prepare("SELECT id FROM comments WHERE id = ?").get(comment.id)) {
        // Comment exists
        updateComment(comment, punch.id)
      } else {
        // Comment doesn't exist yet
        insertComment(comment, punch.id)
      }
    }
  }

  function updatePunch (punch) {
    const result = db.prepare("UPDATE punches SET project=?, inAt=?, outAt=?, rate=?, createdAt=?, updatedAt=? WHERE id = ?")
      .run(
        punch.project,
        punch.in.getTime(),
        punch.out
          ? punch.out.getTime()
          : null,
        punch.rate,
        punch.created.getTime(),
        punch.updated.getTime(),
        punch.id)
    for (let comment of punch.comments) {
      if (db.prepare("SELECT id FROM comments WHERE id = ?").get(comment.id)) {
        // Comment exists
        updateComment(comment, punch.id)
      } else {
        // Comment doesn't exist yet
        insertComment(comment, punch.id)
      }
    }
  }

  return {
    name: 'sqlite',
    db: db,

    async save (punch) {
      // db.prepare("BEGIN").run()
      if (db.prepare("SELECT id FROM punches WHERE id = ?").get(punch.id)) {
        // Already exists
        updatePunch(punch)
      } else {
        // Doesn't exist yet
        insertPunch(punch)
      }
      // db.prepare("COMMIT").run()
    },

    async current (project) {
      let data = (project)
        ? db.prepare("SELECT * FROM punches WHERE outAt IS NULL AND project = '?' ORDER BY inAt DESC").get(project)
        : db.prepare("SELECT * FROM punches WHERE outAt IS NULL ORDER BY inAt DESC").get()

      if (data) {
        const comments = db.prepare("SELECT * FROM comments WHERE punchID=?").all(data.id)
        return instantiatePunch(data, comments)
      } else {
        return null
      }
    },

    async latest (project) {
      let data = (project)
        ? db.prepare("SELECT * FROM punches AND project = '?' ORDER BY inAt DESC LIMIT 1").get(project)
        : db.prepare("SELECT * FROM punches ORDER BY inAt DESC LIMIT 1").get()

      if (data) {
        const comments = db.prepare("SELECT * FROM comments WHERE punchID=?").all(data.id)
        return instantiatePunch(data, comments)
      } else {
        return null
      }
    },

    async select (fn) {
      const selected = []
      const results = db.prepare('SELECT * FROM punches').all()
      for (let p of results) {
        const comments = db.prepare('SELECT * FROM comments WHERE punchID = ?').all(p.id)
        const punch = instantiatePunch(p, comments)
        if (fn(punch)) {
          selected.push(punch)
        }
      }
      return selected
    },

    close () {
      db.close()
    }
  }
}
