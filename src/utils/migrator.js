// Migrate punchfiles from one format to another.

// const schemas = require('./migrator-schemas.js')

module.exports = function (config) {
  const uuid = require('uuid/v1')

  function V1toV2 (obj) {
    // Add created
    let newCreated

    if (obj.punches[0]) {
      newCreated = obj.punches[0].in
    }

    return {
      created: newCreated,
      updated: obj.updated,
      punches: obj.punches.map(punch => {
        return {
          project: punch.project,
          in: punch.in,
          out: punch.out || null,
          rewind: punch.rewind,
          comments: punch.comment != null ? [punch.comment] : []
        }
      })
    }
  }

  function V2toV3 (obj) {
    return {
      version: 3,
      created: obj.created,
      updated: obj.updated,
      punches: obj.punches.map(punch => {
        return {
          id: punch.id,
          project: punch.project,
          in: punch.in,
          out: punch.out || null,
          rate: config.projects[punch.project]
            ? config.projects[punch.project].hourlyRate || 0.0
            : 0.0,
          comments: punch.comments
            .filter(c => typeof c === 'string')
            .map(c => ({
              timestamp: punch.out || Date.now(),
              comment: c
            })),
          created: punch.created || Date.now(),
          updated: punch.updated || Date.now(),
        }
      })
    }
  }

  function pass (obj) {
    return obj
  }

  // Make sure the objects conform to the version they say they are.

  function conformToV1 (obj) {
    return obj
  }

  function conformToV2 (obj) {
    // Make sure punch comments don't have nulls
    obj.punches = obj.punches.map(punch => {
      punch.comments = punch.comments.filter(c => c != null)
      return punch
    })

    return obj
  }

  function conformToV3 (obj) {
    obj.version = 3
    obj.created = obj.created || Date.now()
    obj.updated = obj.updated || Date.now()
    obj.punches = obj.punches.map(punch => ({
      id: punch.id || uuid(),
      project: punch.project,
      in: punch.in,
      out: punch.out || null,
      rate: config.projects[punch.project]
        ? config.projects[punch.project].hourlyRate || 0.0
        : 0.0,
      comments: punch.comments.map(comment => ({
        comment: comment.comment || comment,
        timestamp: comment.timestamp || punch.out || Date.now()
      })),
      created: punch.created || Date.now(),
      updated: punch.updated || Date.now(),
    }))
    return obj
  }

  // Migration paths from one version to another.
  // Invalid conversions will simply return the unaltered object
  const migrations = [
    [[1, 1], [pass, conformToV1]],
    [[1, 2], [V1toV2]],
    [[1, 3], [V1toV2, V2toV3]],

    [[2, 1], [pass, conformToV2]],
    [[2, 2], [pass, conformToV2]],
    [[2, 3], [V2toV3, conformToV3]],

    [[3, 1], [pass, conformToV3]],
    [[3, 2], [pass, conformToV3]],
    [[3, 3], [pass, conformToV3]]
  ]

  function getPunchFileVersion (obj) {
    if (obj.version === 3) {
      return 3
    }

    if (obj.created && obj.updated) {
      return 2
    }

    if (obj.updated && !obj.created) {
      return 1
    }
  }

  function migrate (from, to, file) {
    let migration = migrations.find(m => {
      let [versionFrom, versionTo] = m[0]
      return versionFrom === from && versionTo === to
    })

    let pipeline = migration[1]

    let migrated = file

    pipeline.forEach(func => {
      migrated = func(migrated)
    })

    return migrated
  }

  return { migrate, getPunchFileVersion }
}
