module.exports = function(config, punches, date, project) {
  const format = require('../utils/format')
  const moment = require('moment')
  const chalk = require('chalk')

  const { dayPunches, dayProjectSummaries } = require('./printing')

  /*
    Show punches chronologically in this format:
      11:45am - 5:52pm [BidPro Admin] >> some comment here
                                      >> other comment here
       6:12pm - 8:15pm [SCC Graphics] >> finished poster
  */

  date = moment(date)

  if (punches.length === 0) {
    return console.log('\n' + chalk.bold.white('No sessions for ' + date.format('MMMM Do YYYY')))
  }

  punches = punches
    .filter(punch => !project || punch.project !== project)
    .sort((a, b) => a.in < b.in ? -1 : 1)
    .map(punch => {
      const punchIn = moment(punch.in)
      const punchOut = moment(punch.out || Date.now())

      return {
        project: punch.project,
        current: !punch.out,
        in: punchIn,
        out: punchOut,
        time: punchOut - punchIn,
        comments: punch.comments || [punch.comment],
        duration: format.duration(punchOut - punchIn),
      }
    })

  let projects = punches.reduce((projects, punch) => {
    if (!projects[punch.project]) {
      projects[punch.project] = {
        time: 0,
        sessions: 0,
        pay: 0,
        rate: 0
      }
    }

    projects[punch.project].time += punch.out - punch.in
    projects[punch.project].sessions += 1
    projects[punch.project].name = config.projects[punch.project].name

    return projects
  }, {})

  for (const name in projects) {
    const info = config.projects[name]
    const project = projects[name]

    if (info && info.hourlyRate) {
      project.rate = info.hourlyRate
      project.pay += project.time / 1000 / 60 / 60 * info.hourlyRate
    }
  }


  console.log()
  console.log(dayPunches(punches, projects, config))
  // console.log(dayProjectSummaries(projects, config))
}
