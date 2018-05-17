/*

*/

module.exports = function ({ config, punches, date, summary }) {
  const formatCurrency = require('../format/currency')
  const formatDuration = require('../format/duration')
  // const { ascendingBy, descendingBy } = require('../utils/sort-factories')
  const groupByDay = require('./group-by-day')

  const { projectDay, summaryTable } = require('./printing')

  const days = groupByDay(punches)

  console.log()
  days.forEach(day => {
    console.log(projectDay({
      config,
      date: day.date,
      stats: [
        formatDuration(day.punches.reduce((sum, p) => p.duration() + sum, 0)),
        formatCurrency(day.punches.reduce((sum, p) => p.pay() + sum, 0))
      ],
      punches: day.punches
    }))
  })

  console.log(summaryTable(summary))
}
