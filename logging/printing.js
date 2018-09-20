/*
  Contains all the reusable methods for producing
  different headers and entries for reports.
*/
const chalk = require('chalk')
const Table = require('../format/table')
const formatCurrency = require('../format/currency')
const formatDuration = require('../format/duration')
const formatDate = require('date-fns/format')
// const printLength = require('../utils/print-length')
const wordWrap = require('@fardog/wordwrap')(0, 65, {
  lengthFn: require('../utils/print-length.js')
})

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
function summaryTable (projects, opts = {}) {
  let str = ''

  opts = Object.assign({
    total: true
  }, opts)

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
      project.isPaid ? formatCurrency(project.pay) : chalk.grey('---'),
      project.punches.length + ' punch' + (project.punches.length === 1 ? '' : 'es')
    ])
  })

  str += table.toString()

  if (opts.total) {
    str += '\n' + chalk.bold.cyan('TOTAL') + ' '
    str += delimitedList([
      formatDuration(total.time, { padded: true }),
      formatCurrency(total.pay),
      total.punchCount + ' punch' + (total.punchCount === 1 ? '' : 'es')
    ], ' / ', ['(', ')'])
  }

  return str
}

function monthSummaryHeader ({ date, stats, dateFormat }) {
  let header = ''
  header += chalk.bold.underline(formatDate(date, dateFormat || 'MMMM YYYY'))
  if (stats) {
    header += ' ' + delimitedList(stats, ' / ', ['(', ')'])
  }
  return header + '\n'
}

function daySummaryHeader ({ date, stats, dateFormat }) {
  let header = ''
  header += chalk.bold.underline(formatDate(date, dateFormat || 'ddd, MMM Do'))
  if (stats) {
    header += ' ' + delimitedList(stats, ' / ', ['(', ')'])
  }
  return header + '\n'
}

function projectDay ({ date, stats, punches, config }) {
  let str = ''

  str += '' + daySummaryHeader({ date, stats, dateFormat: config.display.dateFormat }) + '\n'
  str += '  ' + dayPunches(punches, date, config).replace(/\n/g, '\n  ')

  return str
}

function dayPunches (punches, date, config) {
  const symbols = config.symbols
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

    let out = punch.out || new Date()

    if (punch.in < dateStart) {
      carryBack = dateStart.getTime() - punch.in.getTime()
      start = dateStart
    } else {
      start = punch.in
    }

    if (out > dateEnd) {
      carryForward = out.getTime() - dateEnd.getTime()
      end = dateEnd
    } else {
      end = out
    }

    let timeSpan = ''
    if (carryBack) {
      timeSpan += ''.padStart(8) + ' - '
    } else {
      timeSpan += formatDate(start, config.display.timeFormat).padStart(8) + ' - '
    }
    if (punch.out) {
      if (carryForward) {
        timeSpan += ''.padStart(8)
      } else {
        timeSpan += formatDate(end, config.display.timeFormat).padStart(8)
      }
    } else {
      timeSpan += 'NOW'.padStart(8)
    }

    if (punch.out) {
      timeSpan = chalk.cyan(timeSpan)
    } else {
      timeSpan = chalk.bold.green(timeSpan)
    }

    const project = config.projects[punch.project]
    const projectName = project ? project.name : punch.project
    let time
    const hours = punch.durationWithinInterval({ start: dateStart, end: dateEnd }) / 3600000
    if (hours < 1) {
      time = `${~~(hours * 60)}m`
    } else {
      time = `${(hours).toFixed(1)}h`
    }

    if (carryBack) {
      let s = ''
      let hrs = punch.durationWithinInterval({ start: punch.in, end: dateStart }) / 3600000

      s += formatDate(punch.in, config.display.timeFormat).padStart(8) + ' - '
      s += ''.padEnd(8)
      if (hrs < 1) {
        s += `${~~(hrs * 60)}m`.padStart(6)
      } else {
        s += `${(hrs).toFixed(1)}h`.padStart(6)
      }
      s += ` [${projectName}]`
      s += ' (yesterday)'
      str += chalk.grey(s) + '\n'
    }

    str += timeSpan
    str += chalk.blue(time.padStart(6))
    str += chalk.yellow(` [${projectName}]`)
    if (punch.rate) {
      str += chalk.grey(` ($${punch.pay().toFixed(2)})`)
    }
    str += '\n'

    if (carryForward) {
      let s = ''
      let hrs = punch.durationWithinInterval({ start: dateEnd, end: out }) / 3600000

      s += ''.padStart(8) + ' - '
      s += formatDate(out, config.display.timeFormat).padStart(8)
      if (hrs < 1) {
        s += `${~~(hrs * 60)}m`.padStart(6)
      } else {
        s += `${(hrs).toFixed(1)}h`.padStart(6)
      }
      s += ` [${projectName}]`
      s += ' (tomorrow)'
      s += '\n'
      str += chalk.grey(s)
    }

    if (punch.comments.length > 0) {
      punch.comments.forEach((comment, i) => {
        str += chalk.grey(`   ${symbols.logSessionBullet} `) + wordWrap(comment.toString(), 65).replace('\n', '\n     ')

        if (punch.comments[i + 1]) {
          str += '\n'
        }
      })
      str += '\n'
    }
  })

  return str
}

function projectSummary ({ name, description, pay, time, rate, stats }) {
  let str = ''
  const statList = [time]

  if (pay) statList.push(pay)
  if (rate) statList.push(rate)

  str += projectHeader(name) + ' ' + delimitedList(statList, ' / ', ['(', ')']) + '\n'
  str += `${chalk.grey(' >')} ${wordWrap(description).replace('\n', chalk.grey('\n > '))}\n\n`

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
  daySummaryHeader,
  monthSummaryHeader,
  projectHeader,
  projectDay,
  projectSummary
}
