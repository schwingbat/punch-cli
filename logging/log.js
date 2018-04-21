const fs = require('fs')
const Duration = require('../time/duration')

const areSameDay = (one, two) => {
  return one.getFullYear() === two.getFullYear()
      && one.getMonth() === two.getMonth()
      && one.getDate() === two.getDate()
}

const areSameMonth = (one, two) => {
  return one.getFullYear() === two.getFullYear()
      && one.getMonth() === two.getMonth()
}

const areSameYear = (one, two) => {
  return one.getFullYear() === two.getFullYear()
}

function summarize (punches, config) {
  const projects = {}

  const sum = {
    punches: 0,
    pay: 0,
    time: 0
  }

  for (let i = 0; i < punches.length; i++) {
    const punch = punches[i]
    const name = punch.project
    const project = config.projects[name]
    const now = Date.now()
    let rate

    if (punch.rate) {
      rate = punch.rate
    } else if (project && project.hourlyRate) {
      rate = project.hourlyRate / 60 / 60 / 1000
    } else {
      rate = 0
    }

    if (!projects[name]) {
      projects[name] = {
        name: project ? project.name : name,
        punches: 0,
        pay: 0,
        time: 0
      }
    }

    projects[name].punches += 1
    projects[name].pay += ((punch.out || now) - punch.in) * rate
    projects[name].time += (punch.out || now) - punch.in
  }

  const projectArray = []

  for (const alias in projects) {
    projectArray.push({
      alias,
      ...projects[alias]
    })
  }

  // Descending in order of time spent.
  return projectArray.sort((a, b) => b.time - a.time)
}

module.exports = function Reporter(config, flags) {
  const printDay = require('./log-day')
  const printWeek = require('./log-week')
  const printMonth = require('./log-month')
  const moment = require('moment')

  const sqlish = require('../files/sqlish')(config)

  return {
    forTimeSpan (span, project) {
      const punches = sqlish.select()
        .from('punches')
        .where(p => (!project || p.project === project) && p.in >= span.start && p.in <= span.end)
        .run()

      let days = span.totalHours() / 24
      if (days > 31) {
        console.log('Yearly logs are not implemented yet.')
      } else if (days > 7) {
        printMonth({
          config,
          punches,
          today: span.start,
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
