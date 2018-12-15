const services = {
  mock: require('./services/mock.service'),
  punchfile: require('./services/punchfile.service'),
  sqlite: require('./services/sqlite.service'),
  nedb: require('./services/nedb.service')
}

module.exports = function (config) {
  const storageName = config.storageType.toLowerCase()

  if (services[storageName]) {
    return services[storageName]
  } else {
    throw new Error(`Storage service ${config.storageType} does not exist.`)
  }
}
