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
  const Punchfile = require('./punchfile')(config);
  const api = {};

  const defaults = {
    collection: 'punches',
    fields: null,
    condition: null,
    order: 'ascending',
    limit: null
  };

  let options = {};

  function loadCollection() {
    const c = options.collection || defaults.collection;

    let collection = [];

    switch (c) {
    case 'punches':
      Punchfile.all().forEach(file => {
        collection.push(...file.punches);
      });
      break;
    case 'punchfiles':
      collection.push(...Punchfile.all());
      break;
    default:
      throw new Error(`Collection ${c} is not supported (yet)`);
    }

    return collection;
  }

  api.select = function(...fields) {
    if (fields.length === 0 || fields.length === 1 && fields[0] === '*') {
      // Don't set fields
    } else {
      options.fields = fields;
    }

    options.action = 'select';
    return this;
  }

  api.from = function(collection) {
    options.collection = collection.toLowerCase();
    return this;
  }

  api.where = function(func) {
    options.condition = func;
    return this;
  }

  api.orderBy = function(field, dir = 'desc') {
    if (typeof field === 'function') {
      options.orderBy = field;
    } else {
      options.orderBy = (a, b) => {
        const val = a[field] > b[field] ? 1 : -1;
        return dir === 'desc'
          ? val * -1
          : val;
      }
    }

    return this;
  }

  api.limit = function(limit) {
    options.limit = limit;
    return this;
  }

  api.run = function() {
    // Execute the query.
    let collection = loadCollection();

    // Filter (where)
    if (options.condition) {
      collection = collection.filter(p => options.condition(p));
    }

    // Sort
    if (options.orderBy) {
      collection = collection.sort(options.orderBy);
    }

    // Limit
    if (options.limit) {
      collection = collection.slice(0, options.limit);
    }

    // Select
    if (options.fields) {
      collection = collection.map(p => {
        const obj = {};

        options.fields.forEach(f => {
          if (p.hasOwnProperty(f)) {
            obj[f] = p[f];
          } else {
            obj[f] = null;
          }
        });

        return obj;
      });
    }

    return collection;
  }

  return api;
}
