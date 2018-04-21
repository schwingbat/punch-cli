/*
  Contains all the reusable methods for producing
  different headers and entries for reports.
*/

const moment = require('moment')
const chalk = require('chalk')
const Duration = require('../time/duration')
const table = require('../format/table')
const currency = require('../format/currency')

function delimitedList (items, inners = ' / ', outers) {
  let joined = items.filter(i => i).join(chalk.grey(inners))
  if (outers) {
    joined = chalk.grey(outers[0]) + joined + chalk.grey(outers[1])
  }
  return joined
}

const labelTable = (items) => {
  let str = ''
  let length = items.reduce(
      (longest, item) =>
        item.label && item.label.length > longest
          ? item.label.length
          : longest,
        0)

  items.forEach(({ label, value }) => {
    if (!label) {
      str += '   ' + value + '\n'
    } else {
      str += `   ${(label + ':').padStart(length + 2)} ${value}\n`
    }
  })

  return str
}

function reportHeader(text, stats) {
  let str = '\n'

  str += /*'▋  ' + */' ' + chalk.bold(text) + '\n'
  if (stats) {
    str += /*'▋  ' + */' ' + delimitedList(stats)
  }

  return str
}

function projectHeader(text, stats) {
  let str = ''

  str += chalk.bold.yellow(' ' + text)
  if (stats) {
    str += ' ' + delimitedList(stats.filter(s => s).map(s => s.toString()), ' / ', ['(', ')'])
  }

  return str
};

function daySessions(sessions) {
  let str = ''

  sessions.forEach(session => {
    str += '     '

    if (session.timeSpan.slice(session.timeSpan.length - 3).toLowerCase() === 'now') {
      str += chalk.bold.green(session.timeSpan)
    } else {
      str += chalk.cyan(session.timeSpan)
    }

    if (session.comments.length > 0) {
      for (let i = 0; i < session.comments.length; i++) {
        const c = session.comments[i]
        if (!c) continue

        if (i > 0) {
          str += '\n                        ' + chalk.grey(' » ') + c
        } else {
          str += chalk.grey(' » ') + c
        }
      }
    }

    str += '\n'
  })

  return str
}

function dayPunches (punches, projects, config) {
  let str = ''
  // const nameLength = punches.reduce((max, punch) => {
  //   return Math.max(projects[punch.project].name.length, max)
  // }, 0)

  for (let i = 0; i < punches.length; i++) {
    const punch = punches[i]
    const start = moment(punch.in).format(config.timeFormat).padStart(7)
    const end = (punch.current ? 'Now' : moment(punch.out).format(config.timeFormat)).padStart(7)
    const timeSpan = `${start} - ${end}`
    const project = projects.find(p => p.alias === punch.project)
    const projectName = project ? project.name : punch.project

    if (punch.current) {
      str += chalk.bold.green(timeSpan)
    } else {
      str += chalk.cyan(timeSpan)
    }

    str += chalk.yellow(` [${projectName}]`)
    str += '\n'

    if (punch.comments.length > 0) {
      for (let i = 0; i < punch.comments.length; i++) {
        const c = punch.comments[i]

        if (c) {
          str += chalk.grey('   ⸭ ') + c

          if (punch.comments[i + 1]) {
            str += '\n'
          }
        }
      }
      str += '\n'
    }
  }

  return str
}

/* Takes an array like so:
{
  punch: [{
    alias: "punch",
    name: "Punch",
    time: 91902831,
    pay: 89.00,
    punches: 2
  }, {
    alias: "dash"
    ...
  }]
}
*/
function summaryTable (projects) {
  let str = ''

  let total = {
    hours: 0,
    time: 0,
    pay: 0,
    punches: 0
  }

  const tableItems = []

  for (let i = 0; i < projects.length; i++) {
    const project = projects[i]
    const hours = project.time / 1000 / 60 / 60
    total.hours += hours
    total.time += project.time
    total.pay += project.pay
    total.punches += project.punches

    tableItems.push([
      chalk.yellow(project.name),
      new Duration(project.time).toString(),
      currency(project.pay),
      project.punches + ' punch' + (project.punches === 1 ? '' : 'es')
    ])
  }

  if (tableItems.length > 0) {
    console.log(table({ rows: tableItems }))
  }

  str += '\n' + chalk.bold.cyan('TOTAL') + ' '
  str += delimitedList([
    new Duration(total.time).toString(),
    currency(total.pay),
    total.punches + ' punch' + (total.punches === 1 ? '' : 'es')
  ], ' / ', ['(', ')'])

  return str
}

function projectDay ({ date, stats, sessions }) {
  let str = ''

  str += chalk.grey('   ⸭ ') + chalk.bold.white(date.format('MMM Do, dddd'))
  if (stats) {
    str += ' ' + delimitedList(stats, ' / ', ['(', ')']) + '\n'
  }

  str += daySessions(sessions)

  return str
}

function projectSummary ({ name, pay, time, rate, stats }) {
  let str = ''
  const statList = [time]

  if (pay) statList.push(pay)
  if (rate) statList.push(rate)

  str += projectHeader(name) + ' ' + delimitedList(statList, ' / ', ['(', ')']) + '\n\n'

  if (stats) {
    str += labelTable(stats)
  }

  return str
}

module.exports = {
  table,
  delimitedList,
  labelTable,
  reportHeader,
  daySessions,
  dayPunches,
  summaryTable,
  projectHeader,
  projectDay,
  projectSummary
}
