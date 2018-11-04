module.exports = function (config, data, outPath) {
  return new Promise((resolve, reject) => {
    const loadTemplate = require('../load-template')
    const fs = require('fs')
    const path = require('path')

    const result = loadTemplate(path.join(config.invoiceTemplatePath, data.template)).render(data)

    fs.writeFile(outPath, result, (err) => {
      if (err) return reject(err)
      return resolve()
    })
  })
}
