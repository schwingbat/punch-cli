module.exports = function (config) {
  const fs = require('fs')
  const path = require('path')
  const servicePath = path.join(__dirname, 'services')

  const filePath = path.join(servicePath, config.storageType.toLowerCase() + '.service.js')

  if (fs.existsSync(filePath)) {
    return require(filePath)
  } else {
    throw new Error(`Storage service ${config.storageType} does not exist.`)
  }
}
