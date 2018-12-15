module.exports = function MockStorageService (config, Punch) {
  const path = require('path')
  const Datastore = require('nedb')
  const { descendingBy } = require('../../utils/sort-factories')

  const dbPath = path.join(config.punchPath, 'punches.nedb')
  const db = new Datastore({ filename: dbPath, autoload: true })

  return {
    name: 'nedb',
    db: db,

    // Saves a single punch object
    save (punch) {
      return new Promise((resolve, reject) => {
        console.log('saving', punch)
        db.update({ id: punch.id }, punch.toJSON(), { upsert: true }, (err, doc) => {
          if (err) {
            return reject(err)
          } else {
            return resolve(new Punch(doc))
          }
        })
      })
    },

    // Returns the currently running punch (or null)
    // Optionally filters by project
    current (project) {
      return new Promise((resolve, reject) => {
        const query = {
          $and: [
            { in: { $lt: new Date() } },
            { out: null }
          ]
        }

        if (project) {
          query.$and.push({ project: project })
        }

        db.find(query, (err, docs) => {
          if (err) {
            return reject(err)
          } else {
            return resolve(docs[0] ? new Punch(docs[0]) : null)
          }
        })
      })
    },

    // Returns the most recent punch
    // Optionally filters by project
    latest (project) {
      return new Promise((resolve, reject) => {
        db.find(project ? { project: project } : {}, (err, docs) => {
          if (err) {
            return reject(err)
          } else {
            return new Punch(docs.sort(descendingBy('in'))[0])
          }
        })
      })
    },

    // Returns an array of punches for which the passed
    // function returns true. Like 'filter'
    select (fn) {
      return new Promise((resolve, reject) => {
        db.find({}, (err, docs) => {
          if (err) {
            return reject(err)
          } else {
            const matches = docs.map(p => new Punch(p)).filter(p => fn(p))
            return resolve(matches)
          }
        })
      })
    },

    // Deletes a given punch
    delete (punch) {
      return new Promise((resolve, reject) => {
        db.remove({ id: punch.id }, {}, (err, numRemoved) => {
          if (err) {
            return reject(err)
          } else {
            return resolve()
          }
        })
      })
    },

    // Called before the program exits.
    // Close connections and do any necessary cleanup.
    async cleanUp () {}
  }
}