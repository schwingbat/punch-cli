/*
  Contains all the reusable methods for producing
  different headers and entries for reports.
*/
const chalk = require('chalk')
const Table = require('../format/table')
const formatCurrency = require('../format/currency')
const formatDuration = require('../format/duration')
const formatDate = require('date-fns/format')

function delimitedList (items, inners = ' / ', outers) {
  let joined = items.filter(i => i).join(chalk.grey(inners))
  if (outers) {
    joined = chalk.grey(outers[0]) + joined + chalk.grey(outers[1])
  }
  return joined
}

const labelTable = (items) => {
  let str = ''
  let length = items.reduce((longest, item) =>
    item.label && item.label.length > longest
      ? item.label.length
      : longest, 0)

  items.forEach(({ label, value }) => {
    if (!label) {
      str += '   ' + value + '\n'
    } else {
      str += `   ${(label + ':').padStart(length + 2)} ${value}\n`
    }
  })

  return str
}

function reportHeader (text, stats) {
  let str = '\n'

  str += ' ' + chalk.bold(text) + '\n'
  if (stats) {
    str += ' ' + delimitedList(stats)
  }

  return str
}

function projectHeader (text, stats) {
  let str = ''

  str += chalk.bold.yellow(' ' + text)
  if (stats) {
    str += ' ' + delimitedList(stats.filter(s => s).map(s => s.toString()), ' / ', ['(', ')'])
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
    time: 0,
    pay: 0,
    punchCount: 0
  }

  const table = new Table({
    columnStyle: [{
      align: 'left',
      leftPadding: 0,
      rightPadding: 1
    }, {
      align: 'right',
      leftPadding: 1,
      rightPadding: 1
    }, {
      align: 'right',
      leftPadding: 1,
      rightPadding: 1
    }, {
      align: 'right',
      leftPadding: 1,
      rightPadding: 0
    }]
  })

  projects.forEach(project => {
    total.time += project.time
    total.pay += project.pay
    total.punchCount += project.punches.length

    table.push([
      chalk.yellow(project.name),
      formatDuration(project.time, { padded: true }),
      formatCurrency(project.pay),
      project.punches.length + ' punch' + (project.punches.length === 1 ? '' : 'es')
    ])
  })

  str += table.toString()

  str += '\n' + chalk.bold.cyan('TOTAL') + ' '
  str += delimitedList([
    formatDuration(total.time),
    formatCurrency(total.pay),
    total.punchCount + ' punch' + (total.punchCount === 1 ? '' : 'es')
  ], ' / ', ['(', ')'])

  return str
}

function projectDay ({ date, stats, punches, config }) {
  let str = ''

  str += '┏' + '━'.repeat(80) + '┓' + '\n'
  str += '┃  ' + chalk.bold(formatDate(date, 'ddd, MMM Do'))
  if (stats) {
    str += ' ' + delimitedList(stats, ' / ', ['(', ')']) + '\n'
  }
  str += '┗' + '━'.repeat(80) + '┛' + '\n'

  str += '  ' + dayPunches(punches, date, config).replace(/\n/g, '\n  ')

  return str
}

function dayPunches (punches, date, config, indent = 0) {
  let str = ''

  const dateStart = new Date(date)
  dateStart.setHours(0, 0, 0, 0)
  const dateEnd = new Date(dateStart)
  dateEnd.setHours(23, 59, 59, 999)

  punches.forEach(punch => {
    let start
    let end
    let carryForward = 0
    let carryBack = 0

    if (punch.in < dateStart) {
      carryBack = dateStart.getTime() - punch.in.getTime()
      start = dateStart
    } else {
      start = punch.in
    }

    if (punch.out) {
      if (punch.out > dateEnd) {
        carryForward = punch.out.getTime() - dateEnd.getTime()
        end = dateEnd
      } else {
        end = punch.out
      }
    }

    let timeSpan = ''
    if (carryBack) {
      timeSpan += 'MIDNIGHT - '
    } else {
      timeSpan += formatDate(start, config.display.timeFormat).padStart(8) + ' - '
    }
    if (carryForward) {
      timeSpan += 'MIDNIGHT'
    } else {
      if (end) {
        timeSpan += formatDate(end, config.display.timeFormat).padStart(8)
      } else {
        timeSpan += 'NOW'.padStart(8)
      }
    }

    if (end) {
      timeSpan = chalk.cyan(timeSpan)
    } else {
      timeSpan = chalk.bold.green(timeSpan)
    }

    const project = config.projects[punch.project]
    const projectName = project ? project.name : punch.project

    str += timeSpan
    str += chalk.yellow(` [${projectName}]`)
    if (carryBack) {
      str += ' ' + chalk.magenta(`(+ ${formatDuration(carryBack)} yesterday)`)
    }
    if (carryForward) {
      str += ' ' + chalk.magenta(`(+ ${formatDuration(carryForward)} tomorrow)`)
    }
    str += '\n'

    if (punch.comments.length > 0) {
      punch.comments.forEach((comment, i) => {
        str += chalk.grey('   ⸭ ') + comment

        if (punch.comments[i + 1]) {
          str += '\n'
        }
      })
      str += '\n'
    }
  })

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
  delimitedList,
  labelTable,
  reportHeader,
  dayPunches,
  summaryTable,
  projectHeader,
  projectDay,
  projectSummary
}
