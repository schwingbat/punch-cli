/*
 * Log an arbitrary period of time between two dates.
 */

module.exports = function ({ config, punches, summary }) {
  const formatCurrency = require('../format/currency')
  const formatDuration = require('../format/duration')
  const groupByDay = require('./group-by-day')
  const dayGraphic = require('./day-graphic')

  const { projectDay, summaryTable } = require('./printing')

  const days = groupByDay(punches)

  let longestProjectName = 0

  if (config.display.showDayGraphics) {
    for (let i = 0; i < punches.length; i++) {
      const project = config.projects[punches[i].project]
      const name = project ? project.name : punches[i].project

      if (name.length > longestProjectName) {
        longestProjectName = name.length
      }
    }
  }

  let earliest
  let latest

  console.log()
  days.forEach(day => {
    // console.log(day)
    let start = new Date(day.date)
    let end = new Date(day.date)

    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)

    if (!earliest || start < earliest) {
      earliest = start
    }

    if (!latest || end > latest) {
      latest = end
    }

    console.log(projectDay({
      config,
      date: day.date,
      stats: [
        formatDuration(day.punches.reduce((sum, p) => p.durationWithinInterval({ start, end }) + sum, 0)),
        formatCurrency(day.punches.reduce((sum, p) => p.payWithinInterval({ start, end }) + sum, 0))
      ],
      punches: day.punches
    }))

    if (config.display.showDayGraphics) {
      console.log(dayGraphic({
        punches: day.punches,
        date: day.date,
        labelPadding: longestProjectName + 3,
        config
      }))

      console.log()
    }
  })

  console.log(summaryTable(summary, { start: earliest, end: latest }) + '\n')
}
