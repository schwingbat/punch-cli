module.exports = async function (config, data, outPath) {
  const handlebars = require('handlebars')
  const fs = require('fs')
  const path = require('path')
  const formatDate = require('date-fns/format')
  const formatDuration = require('../../format/duration')
  const formatCurrency = require('../../format/currency')
  const PDF = require('html5-to-pdf')

  return new Promise((resolve, reject) => {
    const templateName = data.template || 'standard'
    const templatePath = path.join(__dirname, `../assets/templates/handlebars/${templateName}.hbs`)

    if (!fs.existsSync(templatePath)) {
      return console.error(`Template '${templateName}' doesn't exist in ${path.join(__dirname, 'assets/templates/')}`)
    }

    const template = handlebars.compile(fs.readFileSync(templatePath, 'utf8'))
    const templateData = {
      ...data,
      start: formatDate(data.start, config.invoice.dateFormat),
      end: formatDate(data.end, config.invoice.dateFormat),
      today: formatDate(data.today, config.invoice.dateFormat),
      days: data.days.map(day => ({
        ...day,
        date: formatDate(day.date, config.invoice.dateFormat),
        time: formatDuration(day.time),
        pay: formatCurrency(day.pay)
      })),
      totalPay: formatCurrency(data.totalPay),
      totalTime: formatDuration(data.totalTime)
    }

    const html = template(templateData)

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
