const services = {
  mock: require('./services/mock.service'),
  sqlite: require('./services/sqlite.service'),
  ledger: require('./services/ledger.service')
}

module.exports = function (config) {
  const storageName = config.storageType.toLowerCase()

  if (services[storageName]) {
    return services[storageName]
  } else {
    throw new Error(`Storage service ${config.storageType} does not exist.`)
  }
}
