const { descendingBy } = require('../utils/sort-factories')
const isSameDay = require('date-fns/is_same_day')
const addDays = require('date-fns/add_days')

function summarize (config, punches, interval) {
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

    projects[name].pay += punch.payWithinInterval(interval)
    projects[name].time += punch.durationWithinInterval(interval)
    projects[name].punches.push(punch)
  }

  const projectArray = []

  for (const alias in projects) {
    projectArray.push({
      alias,
      isPaid: config.projects[alias] && config.projects[alias].hourlyRate,
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
    async forInterval (interval, args = {}) {
      let { project, object } = args
      const now = Date.now()
      let punches

      if (interval.start > new Date()) {
        return console.log(messageFor('future-punch-log'))
      }

      // SQLite optimizations
      // Filter with SQL and avoid instantiating when possible
      if (Punch.storage.name === 'sqlite' && !object) {
        punches = Punch.storage.run((db, instantiatePunch) => {
          let intervalStart = interval.start.getTime()
          let intervalEnd = interval.end.getTime()
          let now = Date.now()
          let query = `
            SELECT * FROM punches
            WHERE (
              (outAt IS NOT NULL AND outAt >= ${intervalStart})
              OR
              (outAt IS NULL AND ${now} >= ${intervalStart})
            ) AND (inAt <= ${intervalEnd})
          `
          if (project) {
            query += ` AND project = '${project}'`
          }

          return db.prepare(query)
            .all()
            .map(instantiatePunch)
        })
      } else {
        punches = await Punch.select(p => {
          // Reject if start date is out of the interval's range
          if (!((p.out || now) >= interval.start && p.in <= interval.end)) {
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
      }

      if (punches.length === 0) {
        // Figure out what to say if there are no results
        if (Object.keys(args).length > 0) {
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
        summary: summarize(config, punches, interval),
        interval
      }

      switch (interval.unit) {
      case 'year':
        printYear(logData, summarize)
        break
      case 'month':
        printMonth(logData)
        break
      case 'week':
        console.log('Weekly logs are not implemented yet')
        // printWeek(logData)
        break
      case 'day':
        printDay(logData)
        break
      default:
        throw new Error(`Unknown unit: ${unit}`)
      }
    },
    _summarize: summarize
  }
}
