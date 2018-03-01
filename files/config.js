module.exports = function(options = {}, flags = {}) {
  const fs = require('fs')
  const path = require('path')
  const punchDir = options.punchDir || path.join(require('os').homedir(), '.punch')

  let startedAt = Date.now()
  let file

  try {
    file = require(path.join(punchDir, 'punchconfig.json'))
    const { projects, clients } = file

    projects.find = function(criteria) {
      if (typeof criteria === 'string') {
        // Look up by alias
        return this[criteria]
      } else if (typeof criteria === 'function') {
        // Look up with function
        for (const alias in this) {
          if (alias === criteria) {
            return this[alias]
          }
        }
      } else {
        throw Error(`Find takes either a project alias as a string or a function`)
      }
    }

    // Populate @client references
    for (const alias in projects) {
      const { client, name } = projects[alias]

      if (typeof client === 'string' && client[0] === '@') {
        const clientName = client.slice(1)

        if (clients[clientName]) {
          // Transpose the client data straight into the project object.
          projects[alias].client = clients[clientName]
        } else {
          throw Error(`Project '${name}' references '${client}', but no client with that name exists.`)
        }
      }
    }

  } catch (err) {
    // TODO: Use default settings
    console.error(err);
    throw Error('No readable config file: create a punchconfig.json file in your punch directory and try again.');
  }

  file.configPath = path.join(punchDir, 'punchconfig.json');
  file.trackerPath = path.join(punchDir, 'tracker.json');
  file.punchPath = path.join(punchDir, 'punches');

  if (file.display && file.display && file.display.time) {
    const format = file.display.time.format
    const leadingZeroes = file.display.time.leadingZeroes || false

    if (format == 24) {
      file.timeFormat = leadingZeroes ? 'HH:mm' : 'H:mm'
    } else if (format == 12) {
      file.timeFormat = leadingZeroes ? 'hh:mma' : 'h:mma'
    } else {
      throw Error(`config.display.hourFormat must be either 12 or 24. Got: ${format}`)
    }
  } else {
    file.timeFormat = 'hh:mma'
  }

  if (options && options.overrides) {
    const o = options.overrides;

    if (o.configPath) file.configPath = o.configPath;
    if (o.trackerPath) file.trackerPath = o.trackerPath;
    if (o.punchPath) file.punchPath = o.punchPath;
  }

  if (flags.BENCHMARK) {
    console.log(`Loaded config file in ${Date.now() - startedAt}ms`);
  }

  return file;
}
