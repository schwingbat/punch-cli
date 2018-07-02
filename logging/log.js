const { descendingBy } = require('../utils/sort-factories')
const isSameDay = require('date-fns/is_same_day')
const addDays = require('date-fns/add_days')

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
  const padWithLines = require('../logging/pad-with-lines')
  const messageFor = require('../utils/message-for')
  const printDay = require('./log-day')
  // const printWeek = require('./log-week')
  const printMonth = require('./log-month')
  const printYear = require('./log-year')

  return {
    async forInterval (interval, criteria = {}) {
      let { project, object } = criteria

      if (interval.start > new Date()) {
        return console.log(messageFor('future-punch-log'))
      }

      const punches = await Punch.select(p => {
        // Reject if start date is out of the interval's range
        if (p.in <= interval.start || p.in >= interval.end) {
          return false
        }
        if (project && p.project !== project) {
          return false
        }
        if (object && !p.hasCommentWithObject(object)) {
          return false
        }
        return true
      })

      if (punches.length === 0) {
        // Figure out what to say if there are no results
        if (Object.keys(criteria).length > 0) {
          return console.log(messageFor('no-sessions-with-criteria'))
        } else {
          if (isSameDay(interval.start, new Date())) {
            return console.log(messageFor('no-sessions-today'))
          } else if (isSameDay(interval.start, addDays(new Date(), -1))) {
            return console.log(messageFor('no-sessions-yesterday'))
          } else {
            return console.log(messageFor('no-sessions'))
          }
        }
      }

      const logData = {
        config,
        punches,
        date: interval.start,
        project,
        summary: summarize(config, punches)
      }

      let days = (interval.end.getTime() / 86400000) - (interval.start.getTime() / 86400000)

      if (days > 31) {
        printYear(logData, summarize)
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
