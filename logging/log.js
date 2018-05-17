const { descendingBy } = require('../utils/sort-factories')

function summarize (config, punches) {
  const projects = {}

  for (let i = 0; i < punches.length; i++) {
    const punch = punches[i]
    const name = punch.project
    const project = config.projects[name]

    if (!projects[name]) {
      projects[name] = {
        name: project ? project.name : name,
        pay: 0,
        time: 0,
        punches: []
      }
    }

    projects[name].pay += punch.pay()
    projects[name].time += punch.duration()
    projects[name].punches.push(punch)
  }

  const projectArray = []

  for (const alias in projects) {
    projectArray.push({
      alias,
      ...projects[alias]
    })
  }

  return projectArray.sort(descendingBy('time'))
}

module.exports = function Logger (config, Punch) {
  const printDay = require('./log-day')
  // const printWeek = require('./log-week')
  const printMonth = require('./log-month')
  // const printYear = require('./log-year')

  return {
    async forInterval (interval, project) {
      const punches = await Punch.select(p => {
        return (!project || p.project === project) &&
                p.in.getTime() >= interval.start.getTime() &&
                p.in.getTime() <= interval.end.getTime()
      })

      const logData = {
        config,
        punches,
        date: interval.start,
        project,
        summary: summarize(config, punches)
      }

      let days = (interval.end.getTime() / 86400000) - (interval.start.getTime() / 86400000)

      if (days > 31) {
        console.log('Yearly logs are not implemented yet.')
        // printYear(logData)
      } else if (days > 7) {
        printMonth(logData)
      } else if (days > 1) {
        console.log('Weekly logs are not implemented yet')
        // printWeek(logData)
      } else {
        printDay(logData)
      }
    },
    _summarize: summarize
  }
}
