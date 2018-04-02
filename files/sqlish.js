// Search through punchfiles with a SQL-like syntax.
/*
  Ideally I could write something like:
    select('in', 'out').from('punches').where(p => p.project === 'bidpro').run();
  to get:
    [{
      in: 908129381923,
      out: 90182391283
    }, {
      in: ...,
      out: ...
    }, ...]
  or:
    select('*').from('punches').where(p => p.project === 'workstudy'
                                      && p.out == null).descending().limit(1).run();
  to get the latest 'workstudy' punch in that I'm currently not punched out of
*/

module.exports = function SQLish(config, flags) {
  const Punchfile = require("./punchfile")(config)
  const api = {}

  const defaults = {
    collection: "punches",
    fields: null,
    condition: null,
    order: "ascending",
    limit: null
  }

  let options = {}

  function loadCollection(c = defaults.collection, matcher, limit) {
    let collection = []

    switch (c) {
    case "punches":
      Punchfile.each((file, next) => {
        file.punches.forEach(punch => {
          if (matcher(punch)) {
            collection.push(punch)
          }
        })
        
        if (!limit || collection.length < limit) {
          next()
        }
      })
      break
    case "punchfiles":
      Punchfile.each((file, next) => {
        if (matcher(file)) {
          collection.push(file)
        }
        
        if (!limit || collection.length < limit) {
          next()
        }
      })
      break
    default:
      throw new Error(`Collection ${c} is not supported (yet)`)
    }

    if (limit) {
      collection = collection.slice(0, limit)
    }

    return collection
  }
  
  function buildMatcher(matchers = []) {
    // Compose several functions to be run on an item
    // to decide if it's a match with all conditions or not.
    
    const match = item => {
      for (let i = 0; i < matchers.length; i++) {
        if (!matchers[i](item)) {
          return false
        }
      }
      // If no conditions were false, assume true.
      return true
    }

    match.add = function(func) {
      matchers.push(func)
    }

    return match
  }

  api.select = function(...fields) {
    if (fields.length === 0 || fields.length === 1 && fields[0] === "*") {
      // Don't set fields
    } else {
      options.fields = fields
    }

    options.action = "select"
    return this
  }

  api.from = function(collection) {
    options.collection = collection.toLowerCase()
    return this
  }

  api.where = function(func) {
    options.condition = func
    return this
  }

  api.orderBy = function(field, dir = "desc") {
    if (typeof field === "function") {
      options.orderBy = field
    } else {
      options.orderBy = (a, b) => {
        const val = a[field] > b[field] ? 1 : -1
        return dir === "desc"
          ? val * -1
          : val
      }
    }

    return this
  }

  api.limit = function(limit) {
    options.limit = limit
    return this
  }

  api.run = function() {
    // Execute the query.
    let matcher = buildMatcher()

    // Filter (where)
    if (options.condition) {
      matcher.add(item => item && options.condition(item))
    }

    let collection = loadCollection(options.collection, matcher, options.limit)

    // Sort
    if (options.orderBy) {
      collection = collection.sort(options.orderBy)
    }
    
    // Select
    if (options.fields) {
      collection = collection.map(p => {
        const obj = {}

        options.fields.forEach(f => {
          if (p.hasOwnProperty(f)) {
            obj[f] = p[f]
          } else {
            obj[f] = null
          }
        })

        return obj
      })
    }

    options = {} // Reset options
    return collection
  }

  return api
}
