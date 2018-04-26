const { Duration } = require('luxon')
const { descendingBy } = require('../utils/sort-factories')

function summarize (config, punches) {
  const projects = {}

  for (let i = 0; i < punches.length; i++) {
    const punch = punches[i]
    const name = punch.project
    const project = config.projects[name]
    const now = Date.now()
    let rate

    if (punch.rate) {
      rate = punch.rate
    } else if (project && project.hourlyRate) {
      rate = project.hourlyRate
    } else {
      rate = 0
    }

    if (!projects[name]) {
      projects[name] = {
        name: project ? project.name : name,
        punches: 0,
        pay: 0,
        time: Duration.fromMillis(0)
      }
    }

    const duration = Duration.fromMillis((punch.out || now) - punch.in)

    projects[name].punches += 1
    projects[name].pay += duration.as('hours') * rate
    projects[name].time = projects[name].time.plus(duration)
  }

  const projectArray = []

  for (const alias in projects) {
    projectArray.push({
      alias,
      ...projects[alias]
    })
  }

  return projectArray.sort(descendingBy(t => t.time.as('milliseconds')))
}

module.exports = function Logger (config, Punch) {
  const printDay = require('./log-day')
  // const printWeek = require('./log-week')
  const printMonth = require('./log-month')

  return {
    async forInterval (interval, project) {
      const punches = await Punch.select(p => {
        return (!project || p.project === project) &&
                p.in.valueOf() >= interval.start.valueOf() &
                p.in.valueOf() <= interval.end.valueOf()
      })

      let days = interval.length('days')

      if (days > 31) {
        console.log('Yearly logs are not implemented yet.')
      } else if (days > 7) {
        printMonth({
          config,
          punches,
          date: interval.start,
          project,
          summary: summarize(config, punches)
        })
      } else if (days > 1) {
        console.log('Weekly logs are not implemented yet')
      } else {
        printDay({
          config,
          punches,
          date: interval.start,
          project,
          summary: summarize(config, punches)
        })
      }
    },
    _summarize: summarize
  }
}
