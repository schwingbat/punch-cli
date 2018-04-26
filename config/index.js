module.exports = function (configPath) {
  const fs = require('fs')
  const path = require('path')
  const home = require('os').homedir()

  if (!configPath) {
    configPath = process.env.PUNCH_CONFIG_PATH || path.join(home, '.punch', 'punchconfig.json')
  } else {
    configPath = path.resolve(configPath)
  }

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
  }

  config.punchPath = config.punchPath.replace(/^~/, home)
  config.configPath = configPath

  if (config.textColors === false) {
    require('chalk').level = 0
  }

  return config
}
