/*
  Loads template files in ./assets/{{name}}/*
  Concatenates CSS and passes it to the template as 'styles'
  Compiles the template with data and returns an HTML string
*/

module.exports = function (name, data) {
  const fs = require('fs')
  const path = require('path')
  const handlebars = require('handlebars')
  const templatePath = path.join(__dirname, 'assets', 'templates', name)

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template '${name}' not found.`)
  }

  let template
  let styles = ''

  const contents = fs.readdirSync(templatePath)
  contents.forEach(file => {
    if (file[0] !== '_') {
      const ext = path.extname(file).toLowerCase()

      switch (ext) {
      case '.hbs':
        template = handlebars.compile(fs.readFileSync(path.join(templatePath, file), 'utf8'))
        break;
      case '.css':
        styles += fs.readFileSync(path.join(templatePath, file), 'utf8')
        break;
      }
    }
  })

  if (!template) {
    throw new Error(`Template folder for '${name}' has no Handlebars template!`)
  }

  return template({ styles, ...data })
}