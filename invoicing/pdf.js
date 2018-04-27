module.exports = function (data, outPath) {
  const handlebars = require('handlebars')
  const fs = require('fs')
  const path = require('path')
  const PDF = require('html5-to-pdf')

  return new Promise((resolve, reject) => {
    const templateName = data.template || 'standard'
    const templatePath = path.join(__dirname, 'assets/templates', templateName + '.hbs')

    if (!fs.existsSync(templatePath)) {
      return console.error(`Template '${templateName}' doesn't exist in ${path.join(__dirname, 'assets/templates/')}`)
    }

    const template = handlebars.compile(fs.readFileSync(templatePath, 'utf8'))
    const html = template(data)

    const pdf = new PDF({
      inputBody: html,
      outputPath: outPath,
      options: {
        pageSize: 'Letter'
      },
      renderDelay: 500
    })

    pdf.build((err, buffer) => {
      if (err) {
        return reject(new Error('There was a problem writing to PDF: ' + err))
      }

      return resolve()
    })
  })
}
