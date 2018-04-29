module.exports = function (config) {
  const { ascendingBy } = require('../utils/sort-factories')

  return {
    async generate (props) {
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
  }
}
