module.exports = function (configPath) {
  const fs = require('fs')
  const mkdirp = require('mkdirp')
  const path = require('path')
  const home = require('os').homedir()

  const punchPath = process.env.PUNCH_PATH || path.join(home, '.punch')

  if (!configPath) {
    configPath = path.resolve(path.join(punchPath, 'punchconfig.json'))
  } else {
    configPath = path.resolve(configPath)
  }

  mkdirp.sync(path.dirname(configPath))

  // const configBase = fs.ensureSync(path.dirname(configPath))

  let config = require('./default.json')

  if (fs.existsSync(configPath)) {
    try {
      config = Object.assign(config, require(configPath))
    } catch (err) {}
  } else {
    console.log('No config file found!')
  }

  // Match @client references to their client objects

  const { projects, clients } = config

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

    // Also store the alias in the object
    projects[alias].alias = alias
  }

  config.configPath = configPath
  config.punchPath = punchPath
  config.punchFilePath = path.join(punchPath, 'punches')
  config.punchDBPath = path.join(punchPath, 'punch.db')

  if (config.display.textColors === false) {
    require('chalk').level = 0
  }

  return config
}
