module.exports = function (config, data, outPath) {
  return new Promise((resolve, reject) => {
    const formatData = require('../format-template-data')
    const loadTemplate = require('../load-template')
    const fs = require('fs')

    const html = loadTemplate(data.template || 'standard', formatData(config, data))

    fs.writeFile(outPath, html, (err) => {
      if (err) return reject(err)
      return resolve()
    })
  })
}
