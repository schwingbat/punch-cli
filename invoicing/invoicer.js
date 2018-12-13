module.exports = function (config) {
  const fs = require('fs')
  const { ascendingBy } = require('../utils/sort-factories')
  const formatDate = require('date-fns/format')
  const formatDuration = require('../format/duration')
  const formatCurrency = require('../format/currency')

  const loadFormat = (format) => {
    const customFormats = fs.readdirSync(config.invoiceTemplatePath)

    let formatter

    for (let fmt of customFormats) {
      if (fmt.toLowerCase() === format.toLowerCase()) {
        formatter = require('./formats/custom.format.js')
        break
      }
    }

    if (!formatter) {
      try {
        formatter = require('./formats/' + format.toLowerCase() + '.format.js')
      } catch (err) {
        throw new Error(`Format ${format} is not supported.`)
      }
    }
    return formatter
  }

  return {
    async generate (props) {
      // Load specified format module.

      const format = loadFormat(props.output.format)

      // Group punches by day
    
      let days = {}

      props.punches.forEach(punch => {
        const date = punch.in
        const key = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate()
        if (!days[key]) {
          days[key] = {
            date: new Date(date),
            time: 0,
            pay: 0,
            comments: []
          }
        }

        days[key].time += punch.duration()
        days[key].pay += punch.pay()
        days[key].comments.push(...punch.comments.map(c => {
          return {
            comment: c.comment,
            objects: c.objects.map(o => ({ key: o.key, value: o.value })),
          }
        }))
      })
      days = Object.values(days).sort(ascendingBy('date'))

      // Format the data so the template can render it.

      const data = {
        template: props.output.customFormat ? props.output.format : null,
        project: props.project,
        user: props.user,
        client: props.project.client,
        startDate: formatDate(props.start, config.invoice.dateFormat),
        endDate: formatDate(props.end, config.invoice.dateFormat),
        today: formatDate(props.today, config.invoice.dateFormat),
        totalPay: formatCurrency(days.reduce((sum, day) => sum + day.pay, 0)),
        totalTime: formatDuration(days.reduce((sum, day) => sum + day.time, 0), { resolution: 'minutes' }),
        days: days.map(day => ({
          ...day,
          date: formatDate(day.date, config.invoice.dateFormat),
          time: formatDuration(day.time, { resolution: 'minutes' }),
          pay: formatCurrency(day.pay)
        }))
      }

      // Apply plugin configuration. Right now this just creates links
      // to VSTS issues for @vsts:1234 tags.

      if (props.project.plugins) {
        for (const key in props.project.plugins) {
          days.forEach(day => {
            day.comments.forEach(comment => {
              comment.objects.forEach(object => {
                if (object.key === key) {
                  object.config = props.project.plugins[key]
                }
              })
            })
          })
        }
      }

      // Return the formatted output (actually a Promise).

      return format(config, data, props.output.path)
    }
  }
}
