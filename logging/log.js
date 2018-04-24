const Duration = require('../time/duration')
const { descendingBy } = require('../utils/sort-factories')

function summarize (punches, config) {
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
        time: new Duration()
      }
    }

    const duration = new Duration((punch.out || now) - punch.in)

    projects[name].punches += 1
    projects[name].pay += duration.totalHours() * rate
    projects[name].time = projects[name].time.plus(duration)
  }

  const projectArray = []

  for (const alias in projects) {
    projectArray.push({
      alias,
      ...projects[alias]
    })
  }

  return projectArray.sort(descendingBy(t => t.time.totalMilliseconds()))
}

module.exports = function Reporter(config, flags) {
  const Punch = require('../punches/punch')(config)

  const printDay = require('./log-day')
  // const printWeek = require('./log-week')
  const printMonth = require('./log-month')

  return {
    forTimeSpan (span, project) {
      const punches = Punch.select(p => {
        return (!project || p.project === project)
            && p.in >= span.start
            && p.in <= span.end
      })

      let days = span.totalHours() / 24

      if (days > 31) {
        console.log('Yearly logs are not implemented yet.')
      } else if (days > 7) {
        printMonth({
          config,
          punches,
          date: span.start,
          project,
          summary: summarize(punches, config)
        })
      } else if (days > 1) {
        console.log('Weekly logs are not implemented yet')
      } else {
        printDay({
          config,
          punches,
          date: span.start,
          project,
          summary: summarize(punches, config)
        })
      }
    }
  }
}
