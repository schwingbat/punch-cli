module.exports = (function() {
  const path = require('path')
  const punchDir = path.join(require('os').homedir(), '.punch')
  const configPath = path.join(punchDir, 'punchconfig.json')

  let startedAt = Date.now()
  let config = {
    projects: {},
    clients: {},
    sync: {
      autoSync: false,
      backends: {}
    },
    timeFormat: 'hh:mma',
    textColors: true,
    configPath: configPath,
    punchPath: path.join(punchDir, 'punches'),
  }

  try {
    Object.assign(config, require(configPath))
  } catch (err) {
    const format = require('../utils/format')
    console.log(format.text('WARNING: No config file found at ' + punchPath, ['yellow']))
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

  return config
})()
