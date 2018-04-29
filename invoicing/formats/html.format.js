module.exports = function (config, data, outPath) {
  return new Promise((resolve, reject) => {
    const handlebars = require('handlebars')
    const fs = require('fs')
    const path = require('path')
    const formatDate = require('date-fns/format')
    const formatDuration = require('../../format/duration')
    const formatCurrency = require('../../format/currency')

    // TODO: Format dates and stuff

    const templateName = data.template || 'standard'
    const templatePath = path.join(__dirname, `../assets/templates/handlebars/${templateName}.hbs`)

    if (!fs.existsSync(templatePath)) {
      return reject(new Error(`Template '${templateName}' doesn't exist in ${path.join(__dirname, 'assets/templates/')}`))
    }

    const templateData = {
      ...data,
      start: formatDate(data.start, config.invoice.dateFormat),
      end: formatDate(data.end, config.invoice.dateFormat),
      today: formatDate(data.today, config.invoice.dateFormat),
      days: data.days.map(day => ({
        ...day,
        date: formatDate(day.date, config.invoice.dateFormat),
        time: formatDuration(day.time, { resolution: 'minutes' }),
        pay: formatCurrency(day.pay)
      })),
      totalPay: formatCurrency(data.totalPay),
      totalTime: formatDuration(data.totalTime, { resolution: 'minutes' })
    }

    const template = handlebars.compile(fs.readFileSync(templatePath, 'utf8'))
    const html = template(templateData)

    fs.writeFile(outPath, html, (err) => {
      if (err) return reject(err)
      return resolve()
    })
  })
}
