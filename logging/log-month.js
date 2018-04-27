module.exports = function ({ config, punches, date, summary, project }) {
  const formatCurrency = require('../format/currency')
  const formatDuration = require('../format/duration')
  const { descendingBy } = require('../utils/sort-factories')

  const { projectHeader, projectDay, summaryTable } = require('./printing')

  // Group punches by project

  let projects = {}

  punches.forEach(punch => {
    if (!projects[punch.project]) {
      projects[punch.project] = {
        name: punch.project,
        project: config.projects[punch.project],
        time: 0,
        pay: 0,
        sessions: []
      }
    }

    const obj = projects[punch.project]

    obj.time += punch.duration()
    obj.pay += punch.pay()
    obj.sessions.push(punch)
  })

  // Group by day within project

  const projArr = Object.values(projects)

  projArr.sort(descendingBy('time')).forEach(project => {
    console.log(projectHeader(
      project.project ? project.project.name : project.name,
      [
        formatDuration(project.time),
        project.pay ? formatCurrency(project.pay) : null
      ]
    ))
    console.log()

    // Sort sessions by day
    let sessionsByDay = {}

    project.sessions.forEach(session => {
      const day = session.in.day
      if (!sessionsByDay[day]) sessionsByDay[day] = []
      sessionsByDay[day].push(session)
    })

    for (const day in sessionsByDay) {
      const sum = {
        time: 0,
        pay: 0,
        sessions: []
      }

      sessionsByDay[day].forEach(session => {
        sum.time += session.duration()
        sum.pay += session.pay()
        sum.sessions.push(session)
      })

      console.log(projectDay({
        config,
        date: sessionsByDay[day][0].in,
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
