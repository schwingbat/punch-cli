module.exports = function (configPath) {
  const fs = require('fs')
  const mkdirp = require('mkdirp')
  const path = require('path')
  const home = require('os').homedir()
  const merge = require('../utils/deep-merge.js')
  const is = require('@schwingbat/is')
  const MON = require('@schwingbat/mon')

  const punchPath = process.env.PUNCH_PATH || path.join(home, '.punch')

  if (!configPath) {
    configPath = path.resolve(path.join(punchPath, 'punchconfig'))
  } else {
    configPath = path.resolve(configPath)
  }

  mkdirp.sync(path.dirname(configPath))

  // const configBase = fs.ensureSync(path.dirname(configPath))

  let config = require('./default.json')
  let configFormat

  // Try to load config from MON file first.
  if (fs.existsSync(configPath + '.mon')) {

    const file = fs.readFileSync(configPath + '.mon').toString('utf8')
    const parsed = MON.parse(file)
    config = merge(config, parsed)
    configFormat = '.mon'

    // Store project alias in project object
    for (const alias in config.projects) {
      config.projects[alias].alias = alias
    }

  // If that doesn't work, try to load from JSON file.
  } else if (fs.existsSync(configPath + '.json')) {

    try {
      config = merge(config, require(configPath))
      configFormat = '.json'

      // Match @client references to their client objects.
      // MON handles this automatically with references.
      const { projects, clients } = config

      for (const alias in projects) {
        const { client, name } = projects[alias]

        if (is.string(client) && client[0] === '@') {
          const clientName = client.slice(1)

          if (clients[clientName]) {
            // Transpose the client data straight into the project object.
            projects[alias].client = clients[clientName]
          } else {
            throw Error(`Project '${name}' references '${client}', but no client with that name exists.`)
          }
        }

        // Also store the alias in the object
        projects[alias].alias = alias
      }
    } catch (err) {}

    // Turn addresses into strings
    if (is.object(config.user.address)) {
      const { street, city, state, zip } = config.user.address
      config.user.address = `${street}\n${city}, ${state} ${zip}`
    }

    for (const client in config.clients) {
      const c = config.clients[client]
      if (is.object(c.address)) {
        const { street, city, state, zip } = c.address
        c.address = `${street}\n${city}, ${state} ${zip}`
      }
    }

  // If THAT doesn't work, yer screwed.
  } else {
    console.log('No config file found!')

    const config = require('./setup')()
    console.log(config)
  }

  config.configPath = configPath + (configFormat || '.mon')
  config.punchPath = punchPath
  config.punchFilePath = path.join(punchPath, 'punches')
  config.punchDBPath = path.join(punchPath, 'punch.db')
  config.symbols = require('../utils/symbols')(config)
  config.invoiceTemplatePath = config.invoiceTemplatePath || path.join(punchPath, 'templates', 'invoice')
  config.importerPath = config.importerPath || path.join(punchPath, 'importers')
  config.exporterPath = config.exporterPath || path.join(punchPath, 'exporters')

  mkdirp(config.invoiceTemplatePath)
  mkdirp(config.importerPath)
  mkdirp(config.exporterPath)

  if (config.display.textColors === false) {
    require('chalk').level = 0
  }

  return config
}
