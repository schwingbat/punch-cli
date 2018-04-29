module.exports = function ({ config, punches, date, summary }) {
  const formatCurrency = require('../format/currency')
  const formatDuration = require('../format/duration')
  const { ascendingBy, descendingBy } = require('../utils/sort-factories')

  const { projectHeader, projectDay, summaryTable } = require('./printing')

  summary.sort(descendingBy('time')).forEach(project => {
    console.log(projectHeader(project.name, [
      formatDuration(project.time),
      project.pay ? formatCurrency(project.pay) : null
    ]))
    console.log()

    // Sort sessions by day
    let punchesByDay = {}

    project.punches.sort(ascendingBy('in')).forEach(punch => {
      const day = punch.in.getDate()
      if (!punchesByDay[day]) punchesByDay[day] = []
      punchesByDay[day].push(punch)
    })

    for (const day in punchesByDay) {
      const sum = {
        time: 0,
        pay: 0,
        sessions: []
      }

      punchesByDay[day].forEach(session => {
        sum.time += session.duration()
        sum.pay += session.pay()
        sum.sessions.push(session)
      })

      console.log(projectDay({
        config,
        date: punchesByDay[day][0].in,
        stats: [
          formatDuration(sum.time),
          sum.pay
            ? formatCurrency(sum.pay)
            : null
        ],
        sessions: sum.sessions
      }))
    }
  })

  console.log(summaryTable(summary))
}
