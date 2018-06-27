module.exports = function (config) {
  const { ascendingBy } = require('../utils/sort-factories')

  const formatDate = require('date-fns/format')
  const formatDuration = require('../format/duration')
  const formatCurrency = require('../format/currency')
  const fetch = require('node-fetch')
  const fs = require('fs')

  function generateWithAPI (props) {
    return new Promise((resolve, reject) => {
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
        days[key].comments.push(...punch.comments.map(c => c.toString()))
      })
      days = Object.values(days).sort(ascendingBy('date'))

      const data = {
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

      const url = new URL(`generate/${props.output.format}/standard`, config.invoiceAPI)
      console.log('requesting from ', url.toString())
      fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(res => {
        const out = fs.createWriteStream(props.output.path)
        res.body.pipe(out)
        out.on('finish', () => resolve())
      }).catch(reject)
    })
  }

  async function generateLocally (props) {
    let format
    try {
      format = require('./formats/' + props.output.format.toLowerCase() + '.format.js')
    } catch (err) {
      throw new Error(`Format ${props.output.format} is not supported.`)
    }

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
      days[key].comments.push(...punch.comments.map(c => c.toString()))
    })
    days = Object.values(days).sort(ascendingBy('date'))

    const data = {
      template: 'standard',
      project: props.project,
      user: props.user,
      client: props.project.client,
      start: props.start,
      end: props.end,
      today: props.today,
      totalPay: days.reduce((sum, day) => sum + day.pay, 0),
      totalTime: days.reduce((sum, day) => sum + day.time, 0),
      days
    }

    return format(config, data, props.output.path)
  }

  return {
    async generate (props, genLocal) {
      // Keep the option to generate locally for now until the API is ready.
      if (genLocal || config.generateInvoicesLocally) {
        return generateLocally(props)
      } else {
        return generateWithAPI(props)
      }
    }
  }
}
