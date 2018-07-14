/*

  Yearly logs will contain summaries for each month,
  followed by a summary by project:

  January 2018 (220h 44m 16s / $X,XXX.XX)
    Project 1     160h 21m 10s    $X,XXX.XX    XX punches
    Project 2      22h  8m  5s      $XXX.XX    XX punches

  ...same summary structure for each month

  Projects
    Project 1    1,352h 55m  8s    $44,096.52   681 punches
    ...

  TOTAL (2,365h 51m 8s / $72,536.10 / 1,124 punches)

*/

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

module.exports = function ({ config, punches, date, summary }, summarizeFn) {
  const { summaryTable, monthSummaryHeader } = require('./printing')
  const { ascendingBy } = require('../utils/sort-factories')
  const formatCurrency = require('../format/currency')
  const formatDuration = require('../format/duration')
  const chalk = require('chalk')

  const months = {}

  punches.forEach(punch => {
    const key = punch.in.getMonth()
    if (!months[key]) {
      months[key] = []
    }
    months[key].push(punch)
  })

  const monthArray = []

  for (const key in months) {
    monthArray.push([key, months[key]])
  }

  console.log()

  monthArray
    .sort(ascendingBy(m => m[0]))
    .forEach(([key, punches]) => {
      const monthSummary = summarizeFn(config, punches)

      const monthPay = monthSummary.reduce((sum, project) => sum + project.pay, 0)
      const monthTime = monthSummary.reduce((sum, project) => sum + project.time, 0)
      const monthPunches = monthSummary.reduce((sum, project) => sum + project.punches.length, 0)

      console.log(monthSummaryHeader({
        date: new Date(date.getFullYear(), Number(key)),
        stats: [
          formatDuration(monthTime),
          formatCurrency(monthPay),
          monthPunches + ' punch' + (monthPunches === 1 ? '' : 'es')
        ]
      }))
      console.log('  ' + summaryTable(monthSummary, { total: false }).replace(/\n/g, '\n  '))
    })

  // console.log(months)

  console.log(summaryTable(summary) + '\n')
}