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

function summarize(punches, config) {
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
    forDay(today = new Date(), project) {
      const punches = sqlish
        .select()
        .from('punches')
        .where(p => {
          let match = true;
          if (project && p.project !== project) {
            match = false
          }

          if (match) {
            if ((areSameDay(new Date(), today) && p.out == null) || areSameDay(p.in, today)) {
              return true
            }
          }

          return false
        })
        .run();

      printDay({
        config,
        punches,
        today,
        project,
        summary: summarize(punches, config)
      })
    },
    forWeek(today = new Date(), project) {
      console.log('Weekly logs are not implemented yet.')
    },
    forMonth(today = new Date(), project) {
      const punches = sqlish
        .select()
        .from('punches')
        .where(p => {
          let match = true;
          if (project && p.project !== project) {
            match = false
          }

          if (match) {
            if ((areSameMonth(new Date(), today) && p.out == null) || areSameMonth(p.in, today)) {
              return true
            }
          }

          return false
        })
        .run()

      printMonth({
        config,
        punches,
        today,
        project,
        summary: summarize(punches, config)
      })
    },
    forYear(today = new Date(), project) {
      console.log('Yearly logs are not implemented yet.')
    }
  }

  function reportForMonth(today = new Date(), project) {
    const punches = [];
    const month = today.getMonth() + 1;
    const files = fs.readdirSync(punchPath).filter(file => {
      const [p, y, m, d] = file.split('_');
      return m == month; // double equals because m is a string.
    })

    if (files.length === 0) {
      return console.log(`No punches recorded for ${moment(today).format('MMMM YYYY')}.`)
    }

    files.forEach(file => {
      const f = Punchfile.read(path.join(punchPath, file))
      if (f) punches.push(...f.punches)
    })

    return monthReport(config, punches, today, project)
  }

  function reportForYear(today, project) {
    console.log('Yearly reports are not implemented yet.')
  }
}
