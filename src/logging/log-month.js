/*

*/

module.exports = function ({ config, punches, date, summary }) {
  const formatCurrency = require('../format/currency')
  const formatDuration = require('../format/duration')
  // const { ascendingBy, descendingBy } = require('../utils/sort-factories')
  const groupByDay = require('./group-by-day')
  const dayGraphic = require('./day-graphic')

  const { projectDay, summaryTable } = require('./printing')

  const days = groupByDay(punches)

  let longestProjectName = 0

  if (config.showDayGraphics) {
    for (let i = 0; i < punches.length; i++) {
      const project = config.projects[punches[i].project]
      const name = project ? project.name : punches[i].project
  
      if (name.length > longestProjectName) {
        longestProjectName = name.length
      }
    }
  }

  console.log()
  days.forEach(day => {
    // console.log(day)
    let start = new Date(day.date)
    let end = new Date(day.date)

    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)

    console.log(projectDay({
      config,
      date: day.date,
      stats: [
        formatDuration(day.punches.reduce((sum, p) => p.durationWithinInterval({ start, end }) + sum, 0)),
        formatCurrency(day.punches.reduce((sum, p) => p.payWithinInterval({ start, end }) + sum, 0))
      ],
      punches: day.punches
    }))

    if (config.showDayGraphics) {
      console.log(dayGraphic({
        punches: day.punches,
        date: day.date,
        labelPadding: longestProjectName + 3,
        config
      }))

      console.log()
    }
  })

  console.log(summaryTable(summary) + '\n')
}
