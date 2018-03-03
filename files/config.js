module.exports = (function() {
  const path = require('path')
  const punchDir = path.join(require('os').homedir(), '.punch')
  const configPath = path.join(punchDir, 'punchconfig.json')

  let config = {
    user: {
      name: 'Your Name',
      address: {
        street: '999 Boulevard Ct.',
        city: 'Citytown',
        state: 'NJ',
        zip: '54637'
      }
    },
    projects: {
      example: {
        name: 'An Example Project',
        description: 'A project that exists to show you how config files work.',
        hourlyRate: 50.00,
        client: '@somebody'
      }
    },
    clients: {
      somebody: {
        name: 'Some Body',
        address: {
          street: '123 Street Ave',
          city: 'Townsville',
          state: 'MN',
          zip: '99998'
        }
      }
    },
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
    const fs = require('fs')
    console.log(format.text('WARNING: No config file found at ' + configPath + '. Saving default configuration.', ['yellow']))
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
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
