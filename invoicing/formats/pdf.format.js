module.exports = async function (config, data, outPath) {
  const formatData = require('../format-template-data')
  const loadTemplate = require('../load-template')
  const PDF = require('html5-to-pdf')

  const html = loadTemplate(data.template || 'standard', formatData(config, data))

  const pdf = new PDF({
    inputBody: html,
    outputPath: outPath,
    options: {
      pageSize: 'Letter'
    },
    renderDelay: 500
  })

  await pdf.start()
  await pdf.build()
  await pdf.close()
}
