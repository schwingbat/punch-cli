(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports={
  "user": {
    "name": "Your Name",
    "company": "Alpaca Factory, LLC",
    "address": {
      "street": "999 Boulevard Ct.",
      "city": "Citytown",
      "state": "NJ",
      "zip": "54637"
    }
  },
  "projects": {},
  "clients": {},
  "sync": {
    "autoSync": false,
    "services": []
  },
  "invoice": {
    "dateFormat": "MM/DD/YYYY",
    "timeFormat": "h:mm A"
  },
  "display": {
    "textColors": true,
    "dateFormat": "dddd, MMMM Do YYYY",
    "timeFormat": "h:mm A"
  },
  "punchPath": "~/.punch/punches",
  "storageType": "punchfile"
}
},{}],2:[function(require,module,exports){
module.exports = function (configPath) {
  const fs = require('fs')
  const path = require('path')
  const home = require('os').homedir()

  if (!configPath) {
    configPath = process.env.PUNCH_CONFIG_PATH || path.join(home, '.punch', 'punchconfig.json')
  } else {
    configPath = path.resolve(configPath)
  }

  let config = require('./default.json')

  if (fs.existsSync(configPath)) {
    try {
      config = Object.assign(config, require(configPath))
    } catch (err) {}
  } else {
    console.log('No config file found!')
  }

  // Match @client references to their client objects

  const { projects, clients } = config

  for (const alias in projects) {
    const { client, name } = projects[alias]

    if (typeof client === 'string' && client[0] === '@') {
      const clientName = client.slice(1)

      if (clients[clientName]) {
        // Transpose the client data straight into the project object.
        projects[alias].client = clients[clientName]
      } else {
        throw Error(`Project '${name}' references '${client}', but no client with that name exists.`)
      }
    }

    // Also store the alias in the object
    projects[alias].alias = alias
  }

  config.punchPath = config.punchPath.replace(/^~/, home)
  config.configPath = configPath

  if (config.display.textColors === false) {
    require('chalk').level = 0
  }

  return config
}

},{"./default.json":1,"chalk":16,"fs":undefined,"os":undefined,"path":undefined}],3:[function(require,module,exports){
function encomma (amount, separator = ',') {
  // Add commas at appropriate places for currency.

  let [whole, frac] = amount.split('.')

  if (whole.length > 3) {
    const chars = []
    const rev = whole.split('').reverse()
    for (let i = 0; i < rev.length; i++) {
      chars.push(rev[i])
      if (i !== 0 && i !== rev.length - 1 && (i + 1) % 3=== 0) {
        chars.push(separator)
      }
    }
    return chars.reverse().join('') + '.' + frac
  } else {
    return amount
  }
}

function currency (amount, options = {}) {
  const value = encomma(amount.toFixed(2), options.separator)
  if (options.appendSymbol) {
    return value + (options.symbol || '$')
  } else {
    return (options.symbol || '$') + value
  }
}

currency.cents = function (amount, options) {
  return currency(amount / 100, options)
}

module.exports = currency
},{}],4:[function(require,module,exports){
module.exports = function formatDuration (milliseconds, opts = {}) {
  let resolution = resolutions[opts.resolution]
  if (resolution == null) { resolution = 1 }

  let hours = milliseconds / 3600000
  let minutes = 0
  let seconds = 0

  let remainder = hours - ~~hours
  hours = ~~hours
  minutes = remainder * 60
  remainder = minutes - ~~minutes
  minutes = ~~minutes
  seconds = remainder * 60
  remainder = seconds - ~~seconds
  seconds = ~~seconds
  milliseconds = Math.round(remainder * 1000)

  if (resolution > 0) {
    seconds += Math.round(milliseconds / 1000)
  }
  if (resolution > 1) {
    minutes += Math.round(seconds / 60)
  }
  if (resolution > 2) {
    hours += Math.round(minutes / 60)
  }

  const parts = {}

  if (resolution <= resolutions.hours) {
    if (resolution === resolutions.hours || hours > 0) {
      parts.hours = hours
    }
  }
  if (resolution <= resolutions.minutes) {
    if (resolution === resolutions.minutes || minutes > 0 || hours > 0) {
      parts.minutes = minutes
    }
  }
  if (resolution <= resolutions.seconds) {
    if (resolution === resolutions.seconds || seconds > 0 || minutes > 0 || hours > 0) {
      parts.seconds = seconds
    }
  }
  if (resolution <= resolutions.milliseconds) {
    if (resolution === resolutions.milliseconds || milliseconds > 0 || seconds > 0 || minutes > 0 || hours > 0) {
      parts.milliseconds = milliseconds
    }
  }

  if (opts.style === 'clock') {
    const h = (parts.hours || 0).toString().padStart(2, '0')
    const m = (parts.minutes || 0).toString().padStart(2, '0')
    const s = (parts.seconds || 0).toString().padStart(2, '0')

    return `${h}:${m}:${s}`
  } else {
    let out = []

    if ('hours' in parts) {
      out.push(parts.hours + (opts.long ? ' hours' : 'h'))
    }

    if ('minutes' in parts) {
      out.push(parts.minutes + (opts.long ? ' minutes' : 'm'))
    }

    if ('seconds' in parts) {
      out.push(parts.seconds + (opts.long ? ' seconds' : 's'))
    }

    if ('milliseconds' in parts) {
      out.push(parts.milliseconds + (opts.long ? ' milliseconds' : 'ms'))
    }

    if (opts.long) {
      let str = ''
      out.forEach((part, i) => {
        str += part
        if (i + 2 === out.length) {
          str += ' and '
        } else if (i + 1 < out.length) {
          str += ', '
        }
      })
      return str
    } else {
      return out.join(' ')
    }
  }
}

const resolutions = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,

  ms: 0,
  millisecond: 0,
  milliseconds: 0,

  second: 1,
  seconds: 1,

  minute: 2,
  minutes: 2,

  hour: 3,
  hours: 3
}

},{}],5:[function(require,module,exports){
module.exports = function (config, project) {
  // Turn the detailed object into an array of formatted stats.

  const distanceInWords = require('date-fns/distance_in_words')
  const formatDate = require('date-fns/format')
  const chalk = require('chalk')
  const formatCurrency = require('./currency')
  const formatDuration = require('./duration')

  const {
    fullName,
    totalTime,
    totalPay,
    hourlyRate,
    totalPunches,
    firstPunch,
    latestPunch
  } = project

  let lastActive = latestPunch.out
    ? distanceInWords(latestPunch.out, new Date()) + ' ago'
    : chalk.bold.green('Now')

  return {
    name: fullName,
    pay: totalPay ? formatCurrency(totalPay) : null,
    time: formatDuration(totalTime),
    rate: hourlyRate ? formatCurrency(hourlyRate) + '/hr' : null,
    stats: [
      { label: 'Punches', value: totalPunches },
      { label: 'Started', value: formatDate(firstPunch.in, config.display.dateFormat) },
      { label: 'Last active', value: lastActive }
    ]
  }
}

},{"./currency":3,"./duration":4,"chalk":16,"date-fns/distance_in_words":56,"date-fns/format":73}],6:[function(require,module,exports){
class Table {
  constructor (options = {}) {
    this.rows = []
    this.options = options
  }

  push (...rows) {
    this.rows.push(...rows)
  }

  _leftAlignString (str, length) {
    while (str.length < length) {
      str += ' '
    }
    return str
  }

  _rightAlignString (str, length) {
    while (str.length < length) {
      str = ' ' + str
    }
    return str
  }

  _centerAlignString (str, length) {
    let difference = Math.abs(length - str.length)
    let left = Math.round(difference / 2)
    let right = difference - left

    return this._addStringPadding(str, left, right)
  }

  _addStringPadding (str, left = 0, right = 0) {
    while (left > 0) {
      str = ' ' + str
      left -= 1
    }
    while (right > 0) {
      str = str + ' '
      right -= 1
    }
    return str
  }

  toString () {
    let rows = []
    let columnWidths = []
    let columnStyles = []
    let column = 0
    let looping = true

    this.rows.forEach(cells => {
      cells.forEach((cell, index) => {
        columnWidths[index] = Math.max(cell.length || 0, columnWidths[index] || 0)
      })
    })

    columnWidths.forEach((_, i) => {
      if (this.options.columnStyle) {
        if (this.options.columnStyle[i]) {
          columnStyles.push(this.options.columnStyle[i])
        } else {
          columnStyles.push(this.options.columnStyle)
        }
      } else {
        columnStyles.push({
          align: 'left'
        })
      }
    })

    this.rows.forEach(cells => {
      cells = cells.map((cell, index) => {
        const styles = Object.assign({}, {
          align: 'left',
          leftPadding: 0,
          rightPadding: 0,
        }, columnStyles[index])

        switch (styles.align) {
          case 'left':
            cell = this._leftAlignString(cell, columnWidths[index])
            break
          case 'right':
            cell = this._rightAlignString(cell, columnWidths[index])
            break
          case 'center':
            cell = this._centerAlignString(cell, columnWidths[index])
            break
        }

        cell = this._addStringPadding(cell, styles.leftPadding, styles.rightPadding)
        return cell
      })

      rows.push(cells.join(' '))
    })

    return rows.join('\n') + '\n'
  }
}

module.exports = Table
},{}],7:[function(require,module,exports){
module.exports = function (config) {
  const { ascendingBy } = require('../utils/sort-factories')

  return {
    async generate (props) {
      let format
      try {
        format = require('./formats/' + props.output.format.toLowerCase() + '.format.js')
      } catch (err) {
        throw new Error(`Format ${props.output.format} is not supported.`)
      }

      // Group punches by day

      let days = {}

      props.punches.forEach(punch => {
        const date = punch.in
        const key = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate()
        if (!days[key]) {
          days[key] = {
            date: new Date(date),
            time: 0,
            pay: 0,
            comments: []
          }
        }

        days[key].time += punch.duration()
        days[key].pay += punch.pay()
        days[key].comments.push(...punch.comments.map(c => c.toString()))
      })
      days = Object.values(days).sort(ascendingBy('date'))

      const data = {
        template: 'standard',
        project: props.project,
        user: props.user,
        client: props.project.client,
        start: props.start,
        end: props.end,
        today: props.today,
        totalPay: days.reduce((sum, day) => sum + day.pay, 0),
        totalTime: days.reduce((sum, day) => sum + day.time, 0),
        days
      }

      return format(config, data, props.output.path)
    }
  }
}

},{"../utils/sort-factories":225}],8:[function(require,module,exports){
// Group punches by day, ordered by date.
module.exports = function (punches) {
  const { ascendingBy } = require('../utils/sort-factories')
  const byDay = {}

  punches.forEach(punch => {
    let year = punch.in.getFullYear()
    let month = punch.in.getMonth() + 1
    let day = punch.in.getDate()
    const key = `${year}-${month}-${day}`

    if (!byDay[key]) {
      byDay[key] = []
    }

    byDay[key].push(punch)
  })

  const days = []

  for (const key in byDay) {
    const punches = byDay[key].sort(ascendingBy('in'))
    const date = new Date(punches[0].in)
    date.setHours(0, 0, 0, 0)

    days.push({ date, punches })
  }

  return days.sort(ascendingBy('date'))
}

},{"../utils/sort-factories":225}],9:[function(require,module,exports){
/*
  Show punches chronologically in this format:
    11:45am - 5:52pm [BidPro Admin] >> some comment here
                                    >> other comment here
     6:12pm - 8:15pm [SCC Graphics] >> finished poster
     8:20pm - 1:27am [BidPro]       >> some comment here

  Followed by a projects summary:
    Project    3h 27m 16s    $124.52    1 punch
    ...
*/

module.exports = function ({ config, punches, date, summary, project }) {
  const { ascendingBy } = require('../utils/sort-factories')
  const { dayPunches, summaryTable } = require('./printing')
  const formatDate = require('date-fns/format')

  if (punches.length === 0) {
    const isSameDay = require('date-fns/is_same_day')
    const addDays = require('date-fns/add_days')
    const messageFor = require('../utils/message-for')
    let message

    if (isSameDay(date, new Date())) {
      message = messageFor('no-sessions-today')
    } else if (isSameDay(date, addDays(new Date(), -1))) {
      message = messageFor('no-sessions-yesterday')
    } else {
      message = 'No sessions for ' + formatDate(date, config.display.dateFormat)
    }
    
    return console.log('\n' + message)
  }

  punches = punches
    .filter(punch => !project || punch.project !== project)
    .sort(ascendingBy('in'))

  console.log(`\n${formatDate(date, config.display.dateFormat)}\n`)
  console.log(dayPunches(punches, summary, config))
  console.log(summaryTable(summary))
  console.log()
}

},{"../utils/message-for":220,"../utils/sort-factories":225,"./printing":12,"date-fns/add_days":24,"date-fns/format":73,"date-fns/is_same_day":104}],10:[function(require,module,exports){
/*

*/

module.exports = function ({ config, punches, date, summary }) {
  const formatCurrency = require('../format/currency')
  const formatDuration = require('../format/duration')
  // const { ascendingBy, descendingBy } = require('../utils/sort-factories')
  const groupByDay = require('./group-by-day')

  const { projectDay, summaryTable } = require('./printing')

  const days = groupByDay(punches)

  console.log()
  days.forEach(day => {
    console.log(projectDay({
      config,
      date: day.date,
      stats: [
        formatDuration(day.punches.reduce((sum, p) => p.duration() + sum, 0)),
        formatCurrency(day.punches.reduce((sum, p) => p.pay() + sum, 0))
      ],
      punches: day.punches
    }))
  })

  console.log(summaryTable(summary))
}

},{"../format/currency":3,"../format/duration":4,"./group-by-day":8,"./printing":12}],11:[function(require,module,exports){
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

},{"../utils/sort-factories":225,"./log-day":9,"./log-month":10}],12:[function(require,module,exports){
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

},{"../format/currency":3,"../format/duration":4,"../format/table":6,"chalk":16,"date-fns/format":73}],13:[function(require,module,exports){


const flags = {
  VERBOSE: false,
  BENCHMARK: false,
  NO_SYNC: false
}

// Process command line args into params/flags

const ARGS = process.argv.slice(2)

for (let i = 0; i < ARGS.length; i++) {
  const arg = ARGS[i]

  if (arg[0] === '-') {
    switch (arg.toLowerCase()) {
      case '-v':
        console.log('punch v' + require('./package.json').version)
        process.exit()
        break
      case '--verbose':
        flags.VERBOSE = true
        break
      case '-b':
      case '--benchmark':
        flags.BENCHMARK = true
        require('time-require')
        break
      case '-ns':
      case '--nosync':
      case '--no-sync':
        flags.NO_SYNC = true
        break
    }
  }
}

if (flags.BENCHMARK) {
  require('time-require')
}

const bench = require('./utils/bench')({ disabled: !flags.BENCHMARK })

const config = require('./config')(process.env.PUNCH_CONFIG_PATH)
bench.mark('config loaded')

const Storage = require('./storage')(config)
const Punch = require('./punch/punch')(config, Storage)
const Syncer = require('./sync/syncer')
const Invoicer = require('./invoicing/invoicer')
const Logger = require('./logging/log')

bench.mark('modules loaded')

const resolvePath = require('./utils/resolve-path')
const { ascendingBy } = require('./utils/sort-factories')
const parseDate = require('./utils/parse-date')
const parseDateTime = require('./utils/parse-datetime')

bench.mark('utils loaded')

// Utils
const CLI = require('./utils/cli.js')

const { autoSync } = config.sync

const { command, run, invoke } = CLI({
  name: 'punch',
  version: require('./package.json').version
})

/* ========================= *\
||           Utils           ||
\* ========================= */

const getLabelFor = name => {
  return config.projects[name]
    ? config.projects[name].name
    : name
}

const getMessageFor = require('./utils/message-for')

// const getMessageFor = (condition, opts = {}) => {
//   // Returns a random message from the given file.
//   // Assumes the file is a JSON file containing an array of strings in the resources/messages/ folder.
//   try {
//     const messages = require('./resources/messages/' + condition.toLowerCase().replace(/\s/g, '_') + '.json')
//     const i = Math.round(Math.random() * (messages.length - 1))
//     return messages[i]
//   } catch (err) {
//     return opts.default || `Message file not found for ${condition}...`
//   }
// }

const confirm = question => {
  let response

  while (!['y', 'n', 'yes', 'no'].includes(response)) {
    response = require('readline-sync').question(`${question} [y/n] `).toLowerCase().trim()

    if (response === 'y' || response === 'yes') {
      return true
    } else if (response === 'n' || response === 'no') {
      return false
    } else {
      console.log('Please enter: y, n, yes or no.')
    }
  }
}

const handleSync = async () => {
  if (autoSync && !flags.NO_SYNC) {
    return new Syncer(config, Punch).sync()
  }
}

/* ========================= *\
||       Parse/Dispatch      ||
\* ========================= */

command({
  signature: 'in <project>',
  description: 'start tracking time on a project',
  arguments: [{
    name: 'project',
    description: 'name of the project'
  }],
  run: async function (args) {
    // const format = require('date-fns/format')
    const current = await Punch.current()

    if (current) {
      console.log(`You're already punched in on ${getLabelFor(current.project)}! Punch out first.`)
    } else {
      const punch = new Punch({ project: args.project })
      punch.save()

      // const time = format(new Date(), config.display.timeFormat)
      console.log(`Punched in on ${getLabelFor(args.project)}. ${getMessageFor('punched-in', { default: '' })}`)

      handleSync()
    }
  }
})

command({
  signature: 'out [comment...]',
  description: 'stop tracking time and record an optional description of tasks completed',
  arguments: [{
    name: 'comment',
    description: 'a description of what you worked on',
    parse: words => words.join(' ')
  }],
  run: async function (args) {
    const current = await Punch.current()

    if (current) {
      const formatDate = require('date-fns/format')
      const formatDuration = require('./format/duration')
      const formatCurrency = require('./format/currency')

      current.punchOut(args.comment, { autosave: true })

      const label = getLabelFor(current.project)
      const duration = formatDuration(current.duration())
      const time = formatDate(new Date(), config.display.timeFormat)
      const pay = current.pay()

      let str = `Punched out on ${label} at ${time}. Worked for ${duration}`
      if (pay > 0) {
        str += ` and earned ${formatCurrency(pay)}`
      }
      console.log(str + '.')

      handleSync()
    } else {
      console.log(`You're not punched in!`)
    }
  }
})

command({
  signature: 'comment <comment...>',
  description: 'add a comment to remember what you worked on',
  arguments: [{
    name: 'comment',
    description: 'a description of what you worked on',
    parse: words => words.join(' ')
  }],
  run: async function (args) {
    const current = await Punch.current()

    if (!current) {
      const formatDate = require('date-fns/format')
      const latest = await Punch.latest()

      let label = getLabelFor(latest.project)
      let inTime = latest.in
      let outTime = latest.out
      let date = Date.now()

      let format = ''

      if (inTime.day !== date || outTime.day !== date) {
        format = config.display.timeFormat + ' ' + config.display.dateFormat
      } else {
        format = config.display.timeFormat
      }

      inTime = formatDate(inTime, format)
      outTime = formatDate(outTime, format)

      let str = `You're not punched in. Add to last punch on '${label}' (${inTime} - ${outTime})?`

      if (confirm(str)) {
        latest.addComment(args.comment)
        await latest.save()

        handleSync()
      }
    } else {
      current.addComment(args.comment)
      await current.save()

      console.log('Comment saved.')
      handleSync()
    }
  }
})

command({
  signature: 'now',
  description: 'show stats for the current session',
  run: async function () {
    const current = await Punch.current()

    if (current) {
      // Print current session stats.
      // Project name, current pay, time worked,
    } else {
      let message = "You're not punched in."

      const latest = await Punch.latest()
      if (latest) {
        const formatDuration = require('./format/duration')
        const label = getLabelFor(latest.project)
        const timeDiff = formatDuration(Date.now() - latest.out, { long: true })
        message += ` You punched out of ${label} ${timeDiff} ago.`
      }

      console.log(message)
    }
  }
})

command({
  signature: 'create <project> <timeIn> <timeOut> [comment...]',
  description: 'create a punch',
  arguments: [{
    name: 'project',
    description: 'name of the project',
    parse: function (name) {
      const data = config.projects[name]
      if (data) {
        return data
      } else {
        throw new Error('Project does not exist in your config file')
      }
    }
  }, {
    name: 'timeIn',
    description: 'session starting time',
    parse: parseDateTime
  }, {
    name: 'timeOut',
    description: 'session ending time',
    parse: parseDateTime
  }, {
    name: 'comment',
    description: 'a description of what you worked on',
    parse: words => words.join(' ')
  }],
  run: function (args) {
    const formatDuration = require('./format/duration')
    const formatCurrency = require('./format/currency')
    const formatDate = require('date-fns/format')

    const { project, timeIn, timeOut, comment } = args

    const duration = timeIn.getTime() - timeOut.getTime()
    let pay
    if (project.hourlyRate) {
      pay = formatCurrency(duration / 3600000 * project.hourlyRate)
    } else {
      pay = 'N/A'
    }

    let str = ''
    str += `   Project: ${project.name}\n`
    str += `   Time In: ${formatDate(timeIn, 'dddd, MMM Do YYYY [@] h:mma')}\n`
    str += `  Time Out: ${formatDate(timeOut, 'dddd, MMM Do YYYY [@] h:mma')}\n`
    str += `  Duration: ${formatDuration(duration)}\n`
    str += `       Pay: ${pay}\n`

    if (comment) {
      str += `   Comment: ${comment}\n\n`
    }

    str += '\nCreate this punch?'

    if (confirm(str)) {
      const punch = new Punch({
        project,
        in: timeIn.getTime(),
        out: timeOut.getTime()
      })
      if (args.comment) {
        punch.addComment(args.comment)
      }
      punch.save()

      console.log('Punch created!')

      handleSync()
    }
  }
})

command({
  signature: 'purge <project>',
  description: 'destroy all punches for a given project',
  hidden: true,
  disabled: true,
  run: async function (args) {
    const { project } = args
    const label = getLabelFor(project)
    const punches = await Punch.select(p => p.project === project)

    if (punches.length > 0) {
      const formatDuration = require('./format/duration')
      const totalTime = punches.reduce((sum, p) => sum + p.duration(), 0)
      const duration = formatDuration(totalTime)

      // Confirm and commit changes to files.
      if (confirm(`Purging ${label} would delete ${punches.length} punches totalling ${duration}. Are you sure?`)) {
        console.log('Punch purge not yet re-implemented')
      } else {
        return false
      }
    } else {
      console.log(`${label} has no punches.`)
    }
  }
})

command({
  signature: 'watch',
  description: 'continue running to show automatically updated stats of your current session',
  run: async function () {
    const active = await Punch.current()

    if (active) {
      const formatCurrency = require('./format/currency')
      const formatDuration = require('./format/duration')
      const logUpdate = require('log-update')
      const clock = require('./utils/big-clock')({
        style: 'clockBlockDots',
        letterSpacing: 1
      })

      const update = () => {
        let duration = active.duration()

        let working = `Working on ${getLabelFor(active.project)}`
        let money = formatCurrency(active.pay())
        let numbers = clock.display(formatDuration(duration, { style: 'clock' }))
        let numbersLength = numbers.split('\n')[0].length

        let topLine = working.padEnd(numbersLength - money.length, ' ') + money

        logUpdate('\n' + topLine + '\n' + numbers)
      }

      update()
      setInterval(update, 1000)
    } else {
      console.log('You aren\'t punched in right now.')
    }
  }
})

command({
  signature: 'projects [names...]',
  description: 'show statistics for all projects in your config file',
  run: async function (args) {
    const { projectSummary } = require('./logging/printing')
    const formatSummary = require('./format/project-summary')

    let names = args.names || Object.keys(config.projects)

    let allPunches = await Punch.all()
    allPunches = allPunches.sort(ascendingBy('in'))
    const summaries = []

    for (let i = 0; i < names.length; i++) {
      const project = names[i]
      const punches = allPunches.filter(p => p.project === project)

      if (punches.length > 0) {
        let firstPunch = punches[0]
        let latestPunch = punches[punches.length - 1]

        const projectData = config.projects[project]
        const fullName = getLabelFor(project)
        const totalTime = punches.reduce((sum, punch) => sum + punch.duration(), 0)
        const totalPay = punches.reduce((sum, punch) => sum + punch.pay(), 0)
        const hourlyRate = projectData && projectData.hourlyRate
          ? projectData.hourlyRate
          : 0

        summaries.push({
          fullName,
          totalTime,
          totalPay,
          hourlyRate,
          firstPunch,
          latestPunch,
          totalPunches: punches.length
        })
      }
    }

    console.log()
    summaries
      .sort(ascendingBy('fullName'))
      .forEach(s => console.log(projectSummary(formatSummary(config, s))))
    console.log()
  }
})

command({
  signature: 'log [when...]',
  description: 'show a summary of punches for a given period ("last month", "this week", "two days ago", etc)',
  arguments: [{
    name: 'when',
    description: 'time period to log',
    default: 'today',
    parse: words => words.join(' ')
  }],
  options: [{
    signature: '--project, -p <name>',
    description: 'show only punches for this project'
  }],
  run: function (args) {
    const fuzzyParse = require('./utils/fuzzy-parse')
    const interval = fuzzyParse(args.when).interval()

    if (interval) {
      Logger(config, Punch).forInterval(interval, args.options.project)
    }
  }
})

command({
  signature: 'today',
  description: 'show a summary of today\'s punches (alias of "punch log today")',
  hidden: true,
  run: function () {
    invoke('log today')
  }
})

command({
  signature: 'yesterday',
  description: 'show a summary of yesterday\'s punches (alias of "punch log yesterday")',
  hidden: true,
  run: function () {
    invoke('log yesterday')
  }
})

command({
  signature: 'week',
  description: 'show a summary of punches for the current week (alias of "punch log this week")',
  hidden: true,
  run: function () {
    invoke('log this week')
  }
})

command({
  signature: 'month',
  description: 'show a summary of punches for the current month (alias of "punch log this month")',
  hidden: true,
  run: function () {
    invoke('log this month')
  }
})

command({
  signature: 'invoice <project> <startDate> <endDate> <outputFile>',
  description: 'automatically generate an invoice using punch data',
  arguments: [{
    name: 'project',
    description: 'project alias',
    parse: function (name) {
      const project = config.projects[name]
      if (project) {
        return project
      } else {
        throw new Error('Project is not in your config file')
      }
    }
  }, {
    name: 'startDate',
    description: 'start date for invoice period',
    parse: parseDate
  }, {
    name: 'endDate',
    description: 'end date for invoice period',
    parse: parseDate
  }, {
    name: 'outputFile',
    description: 'file to output to (extension determines format)',
    parse: resolvePath
  }],
  run: async function (args) {
    const active = await Punch.current()

    if (active && active.project === args.project) {
      return console.log(`You're currently punched in on ${getLabelFor(active.project)}. Punch out before creating an invoice.`)
    }
    const { labelTable } = require('./logging/printing')
    const formatDate = require('date-fns/format')
    let { project, startDate, endDate, outputFile } = args

    if (!project.hourlyRate) {
      console.log(`${getLabelFor(project)} has no hourly rate set}`)
      return
    }

    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(23, 59, 59, 999)

    let fileFormat
    let ext = require('path').extname(outputFile)

    switch (ext.toLowerCase()) {
      case '.pdf':
        fileFormat = 'PDF'
        break
      case '.html':
        fileFormat = 'HTML'
        break
      case '.txt':
      case '.md':
        return console.log(`Exporting invoices as ${ext.toLowerCase()} is not yet supported. Use HTML or PDF.`)
      default:
        return console.log(`Can't export to file with an extension of ${ext}`)
    }

    console.log('\n' + labelTable([
      { label: 'Project', value: project.name },
      { label: 'Start Date', value: formatDate(startDate, config.display.dateFormat) },
      { label: 'End Date', value: formatDate(endDate, config.display.dateFormat) },
      { label: 'Invoice Format', value: fileFormat },
      { label: 'Output To', value: resolvePath(outputFile) }
    ]))

    if (confirm('Create invoice?')) {
      const loader = require('./utils/loader')({ text: 'Generating invoice...' })
      loader.start()

      const invoicer = Invoicer(config, flags)
      const punches = await Punch.select(p =>
        p.project === project.alias &&
        p.in.getTime() >= startDate.getTime() &&
        p.in.getTime() <= endDate.getTime())

      try {
        await invoicer.generate({
          project,
          start: startDate,
          end: endDate,
          today: new Date(),
          punches,
          user: config.user,
          output: {
            path: resolvePath(outputFile),
            format: fileFormat
          }
        })
        loader.stop(`${fileFormat} invoice generated!`)
      } catch (err) {
        loader.stop(`There was an error while generating the invoice: ${err.message}`)
      }
    }
  }
})

command({
  signature: 'sync',
  description: 'synchronize with any providers in your config file',
  run: async function () {
    const chalk = require('chalk')
    const loader = require('./utils/loader')()
    const syncer = new Syncer(config, Punch)

    loader.start(`Syncing with Dummy...`)

    const results = await syncer.sync('dummy')

    let report = chalk.green('✓') + ' Synced with Dummy  '
    if (results.uploaded.length > 0) {
      report += `${chalk.grey('[')}${chalk.magenta('⬆')} ${results.uploaded.length}${chalk.grey(']')}`

      if (results.downloaded.length > 0) {
        report += ' '
      }
    }
    if (results.downloaded.length > 0) {
      report += `${chalk.grey('[')}${chalk.cyan('⬇')} ${results.downloaded.length}${chalk.grey(']')}`
    }
    loader.stop(report)
  }
})

command({
  signature: 'config [editor]',
  description: 'open config file in editor - uses EDITOR env var unless an editor command is specified.',
  arguments: [{
    name: 'editor',
    description: 'editor command',
    default: function () {
      return process.env.VISUAL ||
             process.env.EDITOR ||
             (/^win/.test(process.platform) ? 'notepad' : 'vim')
    }
  }],
  run: function (args) {
    require('child_process')
      .spawn(args.editor, [config.configPath], { stdio: 'inherit' })
  }
})

command({
  signature: 'edit [date] [editor]',
  description: 'edit punchfile for the given date - uses EDITOR env var unless and editor command is specified',
  arguments: [{
    name: 'date',
    description: 'date for the desired punchfile (MM-DD-YYYY format)',
    parse: parseDate,
    default: () => new Date()
  }, {
    name: 'editor',
    description: 'editor command',
    default: function () {
      return process.env.VISUAL ||
             process.env.EDITOR ||
             (/^win/.test(process.platform) ? 'notepad' : 'vim')
    }
  }],
  hidden: true,
  run: function (args) {
    const { date, editor } = args

    const y = date.getFullYear()
    const m = date.getMonth() + 1
    const d = date.getDate()
    const filename = `punch_${y}_${m}_${d}.json`
    const file = require('path').join(config.punchPath, filename)

    if (!require('fs').existsSync(file)) {
      return console.log(require('chalk').red('File doesn\'t exist.'))
    }

    require('child_process').spawn(editor, [file], { stdio: 'inherit' })
  }
})

command({
  signature: 'timestamp <time>',
  description: 'get a millisecond timestamp for a given time (mm/dd/yyyy@hh:mm:ss)',
  arguments: [{
    name: 'time',
    description: 'datetime string to get a timestamp for',
    parse: parseDateTime
  }],
  hidden: true,
  run: function (args) {
    const formatDate = require('date-fns/format')
    const chalk = require('chalk')
    const timestamp = args.time.getTime()

    console.log(timestamp + chalk.grey(' << ') + formatDate(args.time, 'MMM Do YYYY, hh:mm:ssa'))
  }
})

command({
  signature: 'migrate <version>',
  description: 'migrate punchfiles with older schemas up to the specified version',
  hidden: true,
  arguments: [{
    name: 'version',
    description: 'target schema version number',
    parse: val => parseInt(val)
  }],
  run: function (args) {
    const { version } = args
    const fs = require('fs')
    const path = require('path')
    const migrator = require('./utils/migrator')
    const dir = fs.readdirSync(config.punchPath)

    dir.forEach(fileName => {
      const filePath = path.join(config.punchPath, fileName)
      let file

      try {
        file = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      } catch (err) {
        console.log('Failed to read file as JSON: ' + filePath)
        return
      }

      const fileVersion = migrator.getPunchfileVersion(file)
      const migrated = migrator.migrate(fileVersion, version, file)

      migrated.updated = Date.now()

      fs.writeFileSync(filePath, JSON.stringify(migrated, null, 2))
      console.log(`Converted ${fileName} from version ${fileVersion} to version ${Math.max(fileVersion, version)}`)
    })
  }
})

run(ARGS.filter(a => a[0] !== '-'))

bench.mark('parsed and run')
bench.printAll()

},{"./config":2,"./format/currency":3,"./format/duration":4,"./format/project-summary":5,"./invoicing/invoicer":7,"./logging/log":11,"./logging/printing":12,"./package.json":210,"./punch/punch":211,"./storage":212,"./sync/syncer":213,"./utils/bench":215,"./utils/big-clock":216,"./utils/cli.js":217,"./utils/fuzzy-parse":218,"./utils/loader":219,"./utils/message-for":220,"./utils/migrator":221,"./utils/parse-date":222,"./utils/parse-datetime":223,"./utils/resolve-path":224,"./utils/sort-factories":225,"chalk":16,"child_process":undefined,"date-fns/format":73,"fs":undefined,"log-update":188,"path":undefined,"readline-sync":193,"time-require":205}],14:[function(require,module,exports){
'use strict';
const x = module.exports;
const ESC = '\u001B[';
const isTerminalApp = process.env.TERM_PROGRAM === 'Apple_Terminal';

x.cursorTo = (x, y) => {
	if (typeof x !== 'number') {
		throw new TypeError('The `x` argument is required');
	}

	if (typeof y !== 'number') {
		return ESC + (x + 1) + 'G';
	}

	return ESC + (y + 1) + ';' + (x + 1) + 'H';
};

x.cursorMove = (x, y) => {
	if (typeof x !== 'number') {
		throw new TypeError('The `x` argument is required');
	}

	let ret = '';

	if (x < 0) {
		ret += ESC + (-x) + 'D';
	} else if (x > 0) {
		ret += ESC + x + 'C';
	}

	if (y < 0) {
		ret += ESC + (-y) + 'A';
	} else if (y > 0) {
		ret += ESC + y + 'B';
	}

	return ret;
};

x.cursorUp = count => ESC + (typeof count === 'number' ? count : 1) + 'A';
x.cursorDown = count => ESC + (typeof count === 'number' ? count : 1) + 'B';
x.cursorForward = count => ESC + (typeof count === 'number' ? count : 1) + 'C';
x.cursorBackward = count => ESC + (typeof count === 'number' ? count : 1) + 'D';

x.cursorLeft = ESC + 'G';
x.cursorSavePosition = ESC + (isTerminalApp ? '7' : 's');
x.cursorRestorePosition = ESC + (isTerminalApp ? '8' : 'u');
x.cursorGetPosition = ESC + '6n';
x.cursorNextLine = ESC + 'E';
x.cursorPrevLine = ESC + 'F';
x.cursorHide = ESC + '?25l';
x.cursorShow = ESC + '?25h';

x.eraseLines = count => {
	let clear = '';

	for (let i = 0; i < count; i++) {
		clear += x.eraseLine + (i < count - 1 ? x.cursorUp() : '');
	}

	if (count) {
		clear += x.cursorLeft;
	}

	return clear;
};

x.eraseEndLine = ESC + 'K';
x.eraseStartLine = ESC + '1K';
x.eraseLine = ESC + '2K';
x.eraseDown = ESC + 'J';
x.eraseUp = ESC + '1J';
x.eraseScreen = ESC + '2J';
x.scrollUp = ESC + 'S';
x.scrollDown = ESC + 'T';

x.clearScreen = '\u001Bc';
x.beep = '\u0007';

x.image = (buf, opts) => {
	opts = opts || {};

	let ret = '\u001B]1337;File=inline=1';

	if (opts.width) {
		ret += `;width=${opts.width}`;
	}

	if (opts.height) {
		ret += `;height=${opts.height}`;
	}

	if (opts.preserveAspectRatio === false) {
		ret += ';preserveAspectRatio=0';
	}

	return ret + ':' + buf.toString('base64') + '\u0007';
};

x.iTerm = {};

x.iTerm.setCwd = cwd => '\u001B]50;CurrentDir=' + (cwd || process.cwd()) + '\u0007';

},{}],15:[function(require,module,exports){
'use strict';

module.exports = () => {
	const pattern = [
		'[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[a-zA-Z\\d]*)*)?\\u0007)',
		'(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PRZcf-ntqry=><~]))'
	].join('|');

	return new RegExp(pattern, 'g');
};

},{}],16:[function(require,module,exports){
'use strict';
const escapeStringRegexp = require('escape-string-regexp');
const ansiStyles = require('ansi-styles');
const stdoutColor = require('supports-color').stdout;

const template = require('./templates.js');

const isSimpleWindowsTerm = process.platform === 'win32' && !(process.env.TERM || '').toLowerCase().startsWith('xterm');

// `supportsColor.level` → `ansiStyles.color[name]` mapping
const levelMapping = ['ansi', 'ansi', 'ansi256', 'ansi16m'];

// `color-convert` models to exclude from the Chalk API due to conflicts and such
const skipModels = new Set(['gray']);

const styles = Object.create(null);

function applyOptions(obj, options) {
	options = options || {};

	// Detect level if not set manually
	const scLevel = stdoutColor ? stdoutColor.level : 0;
	obj.level = options.level === undefined ? scLevel : options.level;
	obj.enabled = 'enabled' in options ? options.enabled : obj.level > 0;
}

function Chalk(options) {
	// We check for this.template here since calling `chalk.constructor()`
	// by itself will have a `this` of a previously constructed chalk object
	if (!this || !(this instanceof Chalk) || this.template) {
		const chalk = {};
		applyOptions(chalk, options);

		chalk.template = function () {
			const args = [].slice.call(arguments);
			return chalkTag.apply(null, [chalk.template].concat(args));
		};

		Object.setPrototypeOf(chalk, Chalk.prototype);
		Object.setPrototypeOf(chalk.template, chalk);

		chalk.template.constructor = Chalk;

		return chalk.template;
	}

	applyOptions(this, options);
}

// Use bright blue on Windows as the normal blue color is illegible
if (isSimpleWindowsTerm) {
	ansiStyles.blue.open = '\u001B[94m';
}

for (const key of Object.keys(ansiStyles)) {
	ansiStyles[key].closeRe = new RegExp(escapeStringRegexp(ansiStyles[key].close), 'g');

	styles[key] = {
		get() {
			const codes = ansiStyles[key];
			return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, key);
		}
	};
}

styles.visible = {
	get() {
		return build.call(this, this._styles || [], true, 'visible');
	}
};

ansiStyles.color.closeRe = new RegExp(escapeStringRegexp(ansiStyles.color.close), 'g');
for (const model of Object.keys(ansiStyles.color.ansi)) {
	if (skipModels.has(model)) {
		continue;
	}

	styles[model] = {
		get() {
			const level = this.level;
			return function () {
				const open = ansiStyles.color[levelMapping[level]][model].apply(null, arguments);
				const codes = {
					open,
					close: ansiStyles.color.close,
					closeRe: ansiStyles.color.closeRe
				};
				return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, model);
			};
		}
	};
}

ansiStyles.bgColor.closeRe = new RegExp(escapeStringRegexp(ansiStyles.bgColor.close), 'g');
for (const model of Object.keys(ansiStyles.bgColor.ansi)) {
	if (skipModels.has(model)) {
		continue;
	}

	const bgModel = 'bg' + model[0].toUpperCase() + model.slice(1);
	styles[bgModel] = {
		get() {
			const level = this.level;
			return function () {
				const open = ansiStyles.bgColor[levelMapping[level]][model].apply(null, arguments);
				const codes = {
					open,
					close: ansiStyles.bgColor.close,
					closeRe: ansiStyles.bgColor.closeRe
				};
				return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, model);
			};
		}
	};
}

const proto = Object.defineProperties(() => {}, styles);

function build(_styles, _empty, key) {
	const builder = function () {
		return applyStyle.apply(builder, arguments);
	};

	builder._styles = _styles;
	builder._empty = _empty;

	const self = this;

	Object.defineProperty(builder, 'level', {
		enumerable: true,
		get() {
			return self.level;
		},
		set(level) {
			self.level = level;
		}
	});

	Object.defineProperty(builder, 'enabled', {
		enumerable: true,
		get() {
			return self.enabled;
		},
		set(enabled) {
			self.enabled = enabled;
		}
	});

	// See below for fix regarding invisible grey/dim combination on Windows
	builder.hasGrey = this.hasGrey || key === 'gray' || key === 'grey';

	// `__proto__` is used because we must return a function, but there is
	// no way to create a function with a different prototype
	builder.__proto__ = proto; // eslint-disable-line no-proto

	return builder;
}

function applyStyle() {
	// Support varags, but simply cast to string in case there's only one arg
	const args = arguments;
	const argsLen = args.length;
	let str = String(arguments[0]);

	if (argsLen === 0) {
		return '';
	}

	if (argsLen > 1) {
		// Don't slice `arguments`, it prevents V8 optimizations
		for (let a = 1; a < argsLen; a++) {
			str += ' ' + args[a];
		}
	}

	if (!this.enabled || this.level <= 0 || !str) {
		return this._empty ? '' : str;
	}

	// Turns out that on Windows dimmed gray text becomes invisible in cmd.exe,
	// see https://github.com/chalk/chalk/issues/58
	// If we're on Windows and we're dealing with a gray color, temporarily make 'dim' a noop.
	const originalDim = ansiStyles.dim.open;
	if (isSimpleWindowsTerm && this.hasGrey) {
		ansiStyles.dim.open = '';
	}

	for (const code of this._styles.slice().reverse()) {
		// Replace any instances already present with a re-opening code
		// otherwise only the part of the string until said closing code
		// will be colored, and the rest will simply be 'plain'.
		str = code.open + str.replace(code.closeRe, code.open) + code.close;

		// Close the styling before a linebreak and reopen
		// after next line to fix a bleed issue on macOS
		// https://github.com/chalk/chalk/pull/92
		str = str.replace(/\r?\n/g, `${code.close}$&${code.open}`);
	}

	// Reset the original `dim` if we changed it to work around the Windows dimmed gray issue
	ansiStyles.dim.open = originalDim;

	return str;
}

function chalkTag(chalk, strings) {
	if (!Array.isArray(strings)) {
		// If chalk() was called by itself or with a string,
		// return the string itself as a string.
		return [].slice.call(arguments, 1).join(' ');
	}

	const args = [].slice.call(arguments, 2);
	const parts = [strings.raw[0]];

	for (let i = 1; i < strings.length; i++) {
		parts.push(String(args[i - 1]).replace(/[{}\\]/g, '\\$&'));
		parts.push(String(strings.raw[i]));
	}

	return template(chalk, parts.join(''));
}

Object.defineProperties(Chalk.prototype, styles);

module.exports = Chalk(); // eslint-disable-line new-cap
module.exports.supportsColor = stdoutColor;
module.exports.default = module.exports; // For TypeScript

},{"./templates.js":18,"ansi-styles":17,"escape-string-regexp":184,"supports-color":199}],17:[function(require,module,exports){
'use strict';
const colorConvert = require('color-convert');

const wrapAnsi16 = (fn, offset) => function () {
	const code = fn.apply(colorConvert, arguments);
	return `\u001B[${code + offset}m`;
};

const wrapAnsi256 = (fn, offset) => function () {
	const code = fn.apply(colorConvert, arguments);
	return `\u001B[${38 + offset};5;${code}m`;
};

const wrapAnsi16m = (fn, offset) => function () {
	const rgb = fn.apply(colorConvert, arguments);
	return `\u001B[${38 + offset};2;${rgb[0]};${rgb[1]};${rgb[2]}m`;
};

function assembleStyles() {
	const codes = new Map();
	const styles = {
		modifier: {
			reset: [0, 0],
			// 21 isn't widely supported and 22 does the same thing
			bold: [1, 22],
			dim: [2, 22],
			italic: [3, 23],
			underline: [4, 24],
			inverse: [7, 27],
			hidden: [8, 28],
			strikethrough: [9, 29]
		},
		color: {
			black: [30, 39],
			red: [31, 39],
			green: [32, 39],
			yellow: [33, 39],
			blue: [34, 39],
			magenta: [35, 39],
			cyan: [36, 39],
			white: [37, 39],
			gray: [90, 39],

			// Bright color
			redBright: [91, 39],
			greenBright: [92, 39],
			yellowBright: [93, 39],
			blueBright: [94, 39],
			magentaBright: [95, 39],
			cyanBright: [96, 39],
			whiteBright: [97, 39]
		},
		bgColor: {
			bgBlack: [40, 49],
			bgRed: [41, 49],
			bgGreen: [42, 49],
			bgYellow: [43, 49],
			bgBlue: [44, 49],
			bgMagenta: [45, 49],
			bgCyan: [46, 49],
			bgWhite: [47, 49],

			// Bright color
			bgBlackBright: [100, 49],
			bgRedBright: [101, 49],
			bgGreenBright: [102, 49],
			bgYellowBright: [103, 49],
			bgBlueBright: [104, 49],
			bgMagentaBright: [105, 49],
			bgCyanBright: [106, 49],
			bgWhiteBright: [107, 49]
		}
	};

	// Fix humans
	styles.color.grey = styles.color.gray;

	for (const groupName of Object.keys(styles)) {
		const group = styles[groupName];

		for (const styleName of Object.keys(group)) {
			const style = group[styleName];

			styles[styleName] = {
				open: `\u001B[${style[0]}m`,
				close: `\u001B[${style[1]}m`
			};

			group[styleName] = styles[styleName];

			codes.set(style[0], style[1]);
		}

		Object.defineProperty(styles, groupName, {
			value: group,
			enumerable: false
		});

		Object.defineProperty(styles, 'codes', {
			value: codes,
			enumerable: false
		});
	}

	const ansi2ansi = n => n;
	const rgb2rgb = (r, g, b) => [r, g, b];

	styles.color.close = '\u001B[39m';
	styles.bgColor.close = '\u001B[49m';

	styles.color.ansi = {
		ansi: wrapAnsi16(ansi2ansi, 0)
	};
	styles.color.ansi256 = {
		ansi256: wrapAnsi256(ansi2ansi, 0)
	};
	styles.color.ansi16m = {
		rgb: wrapAnsi16m(rgb2rgb, 0)
	};

	styles.bgColor.ansi = {
		ansi: wrapAnsi16(ansi2ansi, 10)
	};
	styles.bgColor.ansi256 = {
		ansi256: wrapAnsi256(ansi2ansi, 10)
	};
	styles.bgColor.ansi16m = {
		rgb: wrapAnsi16m(rgb2rgb, 10)
	};

	for (let key of Object.keys(colorConvert)) {
		if (typeof colorConvert[key] !== 'object') {
			continue;
		}

		const suite = colorConvert[key];

		if (key === 'ansi16') {
			key = 'ansi';
		}

		if ('ansi16' in suite) {
			styles.color.ansi[key] = wrapAnsi16(suite.ansi16, 0);
			styles.bgColor.ansi[key] = wrapAnsi16(suite.ansi16, 10);
		}

		if ('ansi256' in suite) {
			styles.color.ansi256[key] = wrapAnsi256(suite.ansi256, 0);
			styles.bgColor.ansi256[key] = wrapAnsi256(suite.ansi256, 10);
		}

		if ('rgb' in suite) {
			styles.color.ansi16m[key] = wrapAnsi16m(suite.rgb, 0);
			styles.bgColor.ansi16m[key] = wrapAnsi16m(suite.rgb, 10);
		}
	}

	return styles;
}

// Make the export immutable
Object.defineProperty(module, 'exports', {
	enumerable: true,
	get: assembleStyles
});

},{"color-convert":21}],18:[function(require,module,exports){
'use strict';
const TEMPLATE_REGEX = /(?:\\(u[a-f\d]{4}|x[a-f\d]{2}|.))|(?:\{(~)?(\w+(?:\([^)]*\))?(?:\.\w+(?:\([^)]*\))?)*)(?:[ \t]|(?=\r?\n)))|(\})|((?:.|[\r\n\f])+?)/gi;
const STYLE_REGEX = /(?:^|\.)(\w+)(?:\(([^)]*)\))?/g;
const STRING_REGEX = /^(['"])((?:\\.|(?!\1)[^\\])*)\1$/;
const ESCAPE_REGEX = /\\(u[a-f\d]{4}|x[a-f\d]{2}|.)|([^\\])/gi;

const ESCAPES = new Map([
	['n', '\n'],
	['r', '\r'],
	['t', '\t'],
	['b', '\b'],
	['f', '\f'],
	['v', '\v'],
	['0', '\0'],
	['\\', '\\'],
	['e', '\u001B'],
	['a', '\u0007']
]);

function unescape(c) {
	if ((c[0] === 'u' && c.length === 5) || (c[0] === 'x' && c.length === 3)) {
		return String.fromCharCode(parseInt(c.slice(1), 16));
	}

	return ESCAPES.get(c) || c;
}

function parseArguments(name, args) {
	const results = [];
	const chunks = args.trim().split(/\s*,\s*/g);
	let matches;

	for (const chunk of chunks) {
		if (!isNaN(chunk)) {
			results.push(Number(chunk));
		} else if ((matches = chunk.match(STRING_REGEX))) {
			results.push(matches[2].replace(ESCAPE_REGEX, (m, escape, chr) => escape ? unescape(escape) : chr));
		} else {
			throw new Error(`Invalid Chalk template style argument: ${chunk} (in style '${name}')`);
		}
	}

	return results;
}

function parseStyle(style) {
	STYLE_REGEX.lastIndex = 0;

	const results = [];
	let matches;

	while ((matches = STYLE_REGEX.exec(style)) !== null) {
		const name = matches[1];

		if (matches[2]) {
			const args = parseArguments(name, matches[2]);
			results.push([name].concat(args));
		} else {
			results.push([name]);
		}
	}

	return results;
}

function buildStyle(chalk, styles) {
	const enabled = {};

	for (const layer of styles) {
		for (const style of layer.styles) {
			enabled[style[0]] = layer.inverse ? null : style.slice(1);
		}
	}

	let current = chalk;
	for (const styleName of Object.keys(enabled)) {
		if (Array.isArray(enabled[styleName])) {
			if (!(styleName in current)) {
				throw new Error(`Unknown Chalk style: ${styleName}`);
			}

			if (enabled[styleName].length > 0) {
				current = current[styleName].apply(current, enabled[styleName]);
			} else {
				current = current[styleName];
			}
		}
	}

	return current;
}

module.exports = (chalk, tmp) => {
	const styles = [];
	const chunks = [];
	let chunk = [];

	// eslint-disable-next-line max-params
	tmp.replace(TEMPLATE_REGEX, (m, escapeChar, inverse, style, close, chr) => {
		if (escapeChar) {
			chunk.push(unescape(escapeChar));
		} else if (style) {
			const str = chunk.join('');
			chunk = [];
			chunks.push(styles.length === 0 ? str : buildStyle(chalk, styles)(str));
			styles.push({inverse, styles: parseStyle(style)});
		} else if (close) {
			if (styles.length === 0) {
				throw new Error('Found extraneous } in Chalk template literal');
			}

			chunks.push(buildStyle(chalk, styles)(chunk.join('')));
			chunk = [];
			styles.pop();
		} else {
			chunk.push(chr);
		}
	});

	chunks.push(chunk.join(''));

	if (styles.length > 0) {
		const errMsg = `Chalk template literal is missing ${styles.length} closing bracket${styles.length === 1 ? '' : 's'} (\`}\`)`;
		throw new Error(errMsg);
	}

	return chunks.join('');
};

},{}],19:[function(require,module,exports){
'use strict';
const restoreCursor = require('restore-cursor');

let hidden = false;

exports.show = stream => {
	const s = stream || process.stderr;

	if (!s.isTTY) {
		return;
	}

	hidden = false;
	s.write('\u001b[?25h');
};

exports.hide = stream => {
	const s = stream || process.stderr;

	if (!s.isTTY) {
		return;
	}

	restoreCursor();
	hidden = true;
	s.write('\u001b[?25l');
};

exports.toggle = (force, stream) => {
	if (force !== undefined) {
		hidden = force;
	}

	if (hidden) {
		exports.show(stream);
	} else {
		exports.hide(stream);
	}
};

},{"restore-cursor":194}],20:[function(require,module,exports){
/* MIT license */
var cssKeywords = require('color-name');

// NOTE: conversions should only return primitive values (i.e. arrays, or
//       values that give correct `typeof` results).
//       do not use box values types (i.e. Number(), String(), etc.)

var reverseKeywords = {};
for (var key in cssKeywords) {
	if (cssKeywords.hasOwnProperty(key)) {
		reverseKeywords[cssKeywords[key]] = key;
	}
}

var convert = module.exports = {
	rgb: {channels: 3, labels: 'rgb'},
	hsl: {channels: 3, labels: 'hsl'},
	hsv: {channels: 3, labels: 'hsv'},
	hwb: {channels: 3, labels: 'hwb'},
	cmyk: {channels: 4, labels: 'cmyk'},
	xyz: {channels: 3, labels: 'xyz'},
	lab: {channels: 3, labels: 'lab'},
	lch: {channels: 3, labels: 'lch'},
	hex: {channels: 1, labels: ['hex']},
	keyword: {channels: 1, labels: ['keyword']},
	ansi16: {channels: 1, labels: ['ansi16']},
	ansi256: {channels: 1, labels: ['ansi256']},
	hcg: {channels: 3, labels: ['h', 'c', 'g']},
	apple: {channels: 3, labels: ['r16', 'g16', 'b16']},
	gray: {channels: 1, labels: ['gray']}
};

// hide .channels and .labels properties
for (var model in convert) {
	if (convert.hasOwnProperty(model)) {
		if (!('channels' in convert[model])) {
			throw new Error('missing channels property: ' + model);
		}

		if (!('labels' in convert[model])) {
			throw new Error('missing channel labels property: ' + model);
		}

		if (convert[model].labels.length !== convert[model].channels) {
			throw new Error('channel and label counts mismatch: ' + model);
		}

		var channels = convert[model].channels;
		var labels = convert[model].labels;
		delete convert[model].channels;
		delete convert[model].labels;
		Object.defineProperty(convert[model], 'channels', {value: channels});
		Object.defineProperty(convert[model], 'labels', {value: labels});
	}
}

convert.rgb.hsl = function (rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;
	var min = Math.min(r, g, b);
	var max = Math.max(r, g, b);
	var delta = max - min;
	var h;
	var s;
	var l;

	if (max === min) {
		h = 0;
	} else if (r === max) {
		h = (g - b) / delta;
	} else if (g === max) {
		h = 2 + (b - r) / delta;
	} else if (b === max) {
		h = 4 + (r - g) / delta;
	}

	h = Math.min(h * 60, 360);

	if (h < 0) {
		h += 360;
	}

	l = (min + max) / 2;

	if (max === min) {
		s = 0;
	} else if (l <= 0.5) {
		s = delta / (max + min);
	} else {
		s = delta / (2 - max - min);
	}

	return [h, s * 100, l * 100];
};

convert.rgb.hsv = function (rgb) {
	var r = rgb[0];
	var g = rgb[1];
	var b = rgb[2];
	var min = Math.min(r, g, b);
	var max = Math.max(r, g, b);
	var delta = max - min;
	var h;
	var s;
	var v;

	if (max === 0) {
		s = 0;
	} else {
		s = (delta / max * 1000) / 10;
	}

	if (max === min) {
		h = 0;
	} else if (r === max) {
		h = (g - b) / delta;
	} else if (g === max) {
		h = 2 + (b - r) / delta;
	} else if (b === max) {
		h = 4 + (r - g) / delta;
	}

	h = Math.min(h * 60, 360);

	if (h < 0) {
		h += 360;
	}

	v = ((max / 255) * 1000) / 10;

	return [h, s, v];
};

convert.rgb.hwb = function (rgb) {
	var r = rgb[0];
	var g = rgb[1];
	var b = rgb[2];
	var h = convert.rgb.hsl(rgb)[0];
	var w = 1 / 255 * Math.min(r, Math.min(g, b));

	b = 1 - 1 / 255 * Math.max(r, Math.max(g, b));

	return [h, w * 100, b * 100];
};

convert.rgb.cmyk = function (rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;
	var c;
	var m;
	var y;
	var k;

	k = Math.min(1 - r, 1 - g, 1 - b);
	c = (1 - r - k) / (1 - k) || 0;
	m = (1 - g - k) / (1 - k) || 0;
	y = (1 - b - k) / (1 - k) || 0;

	return [c * 100, m * 100, y * 100, k * 100];
};

/**
 * See https://en.m.wikipedia.org/wiki/Euclidean_distance#Squared_Euclidean_distance
 * */
function comparativeDistance(x, y) {
	return (
		Math.pow(x[0] - y[0], 2) +
		Math.pow(x[1] - y[1], 2) +
		Math.pow(x[2] - y[2], 2)
	);
}

convert.rgb.keyword = function (rgb) {
	var reversed = reverseKeywords[rgb];
	if (reversed) {
		return reversed;
	}

	var currentClosestDistance = Infinity;
	var currentClosestKeyword;

	for (var keyword in cssKeywords) {
		if (cssKeywords.hasOwnProperty(keyword)) {
			var value = cssKeywords[keyword];

			// Compute comparative distance
			var distance = comparativeDistance(rgb, value);

			// Check if its less, if so set as closest
			if (distance < currentClosestDistance) {
				currentClosestDistance = distance;
				currentClosestKeyword = keyword;
			}
		}
	}

	return currentClosestKeyword;
};

convert.keyword.rgb = function (keyword) {
	return cssKeywords[keyword];
};

convert.rgb.xyz = function (rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;

	// assume sRGB
	r = r > 0.04045 ? Math.pow(((r + 0.055) / 1.055), 2.4) : (r / 12.92);
	g = g > 0.04045 ? Math.pow(((g + 0.055) / 1.055), 2.4) : (g / 12.92);
	b = b > 0.04045 ? Math.pow(((b + 0.055) / 1.055), 2.4) : (b / 12.92);

	var x = (r * 0.4124) + (g * 0.3576) + (b * 0.1805);
	var y = (r * 0.2126) + (g * 0.7152) + (b * 0.0722);
	var z = (r * 0.0193) + (g * 0.1192) + (b * 0.9505);

	return [x * 100, y * 100, z * 100];
};

convert.rgb.lab = function (rgb) {
	var xyz = convert.rgb.xyz(rgb);
	var x = xyz[0];
	var y = xyz[1];
	var z = xyz[2];
	var l;
	var a;
	var b;

	x /= 95.047;
	y /= 100;
	z /= 108.883;

	x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + (16 / 116);
	y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + (16 / 116);
	z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + (16 / 116);

	l = (116 * y) - 16;
	a = 500 * (x - y);
	b = 200 * (y - z);

	return [l, a, b];
};

convert.hsl.rgb = function (hsl) {
	var h = hsl[0] / 360;
	var s = hsl[1] / 100;
	var l = hsl[2] / 100;
	var t1;
	var t2;
	var t3;
	var rgb;
	var val;

	if (s === 0) {
		val = l * 255;
		return [val, val, val];
	}

	if (l < 0.5) {
		t2 = l * (1 + s);
	} else {
		t2 = l + s - l * s;
	}

	t1 = 2 * l - t2;

	rgb = [0, 0, 0];
	for (var i = 0; i < 3; i++) {
		t3 = h + 1 / 3 * -(i - 1);
		if (t3 < 0) {
			t3++;
		}
		if (t3 > 1) {
			t3--;
		}

		if (6 * t3 < 1) {
			val = t1 + (t2 - t1) * 6 * t3;
		} else if (2 * t3 < 1) {
			val = t2;
		} else if (3 * t3 < 2) {
			val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
		} else {
			val = t1;
		}

		rgb[i] = val * 255;
	}

	return rgb;
};

convert.hsl.hsv = function (hsl) {
	var h = hsl[0];
	var s = hsl[1] / 100;
	var l = hsl[2] / 100;
	var smin = s;
	var lmin = Math.max(l, 0.01);
	var sv;
	var v;

	l *= 2;
	s *= (l <= 1) ? l : 2 - l;
	smin *= lmin <= 1 ? lmin : 2 - lmin;
	v = (l + s) / 2;
	sv = l === 0 ? (2 * smin) / (lmin + smin) : (2 * s) / (l + s);

	return [h, sv * 100, v * 100];
};

convert.hsv.rgb = function (hsv) {
	var h = hsv[0] / 60;
	var s = hsv[1] / 100;
	var v = hsv[2] / 100;
	var hi = Math.floor(h) % 6;

	var f = h - Math.floor(h);
	var p = 255 * v * (1 - s);
	var q = 255 * v * (1 - (s * f));
	var t = 255 * v * (1 - (s * (1 - f)));
	v *= 255;

	switch (hi) {
		case 0:
			return [v, t, p];
		case 1:
			return [q, v, p];
		case 2:
			return [p, v, t];
		case 3:
			return [p, q, v];
		case 4:
			return [t, p, v];
		case 5:
			return [v, p, q];
	}
};

convert.hsv.hsl = function (hsv) {
	var h = hsv[0];
	var s = hsv[1] / 100;
	var v = hsv[2] / 100;
	var vmin = Math.max(v, 0.01);
	var lmin;
	var sl;
	var l;

	l = (2 - s) * v;
	lmin = (2 - s) * vmin;
	sl = s * vmin;
	sl /= (lmin <= 1) ? lmin : 2 - lmin;
	sl = sl || 0;
	l /= 2;

	return [h, sl * 100, l * 100];
};

// http://dev.w3.org/csswg/css-color/#hwb-to-rgb
convert.hwb.rgb = function (hwb) {
	var h = hwb[0] / 360;
	var wh = hwb[1] / 100;
	var bl = hwb[2] / 100;
	var ratio = wh + bl;
	var i;
	var v;
	var f;
	var n;

	// wh + bl cant be > 1
	if (ratio > 1) {
		wh /= ratio;
		bl /= ratio;
	}

	i = Math.floor(6 * h);
	v = 1 - bl;
	f = 6 * h - i;

	if ((i & 0x01) !== 0) {
		f = 1 - f;
	}

	n = wh + f * (v - wh); // linear interpolation

	var r;
	var g;
	var b;
	switch (i) {
		default:
		case 6:
		case 0: r = v; g = n; b = wh; break;
		case 1: r = n; g = v; b = wh; break;
		case 2: r = wh; g = v; b = n; break;
		case 3: r = wh; g = n; b = v; break;
		case 4: r = n; g = wh; b = v; break;
		case 5: r = v; g = wh; b = n; break;
	}

	return [r * 255, g * 255, b * 255];
};

convert.cmyk.rgb = function (cmyk) {
	var c = cmyk[0] / 100;
	var m = cmyk[1] / 100;
	var y = cmyk[2] / 100;
	var k = cmyk[3] / 100;
	var r;
	var g;
	var b;

	r = 1 - Math.min(1, c * (1 - k) + k);
	g = 1 - Math.min(1, m * (1 - k) + k);
	b = 1 - Math.min(1, y * (1 - k) + k);

	return [r * 255, g * 255, b * 255];
};

convert.xyz.rgb = function (xyz) {
	var x = xyz[0] / 100;
	var y = xyz[1] / 100;
	var z = xyz[2] / 100;
	var r;
	var g;
	var b;

	r = (x * 3.2406) + (y * -1.5372) + (z * -0.4986);
	g = (x * -0.9689) + (y * 1.8758) + (z * 0.0415);
	b = (x * 0.0557) + (y * -0.2040) + (z * 1.0570);

	// assume sRGB
	r = r > 0.0031308
		? ((1.055 * Math.pow(r, 1.0 / 2.4)) - 0.055)
		: r * 12.92;

	g = g > 0.0031308
		? ((1.055 * Math.pow(g, 1.0 / 2.4)) - 0.055)
		: g * 12.92;

	b = b > 0.0031308
		? ((1.055 * Math.pow(b, 1.0 / 2.4)) - 0.055)
		: b * 12.92;

	r = Math.min(Math.max(0, r), 1);
	g = Math.min(Math.max(0, g), 1);
	b = Math.min(Math.max(0, b), 1);

	return [r * 255, g * 255, b * 255];
};

convert.xyz.lab = function (xyz) {
	var x = xyz[0];
	var y = xyz[1];
	var z = xyz[2];
	var l;
	var a;
	var b;

	x /= 95.047;
	y /= 100;
	z /= 108.883;

	x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + (16 / 116);
	y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + (16 / 116);
	z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + (16 / 116);

	l = (116 * y) - 16;
	a = 500 * (x - y);
	b = 200 * (y - z);

	return [l, a, b];
};

convert.lab.xyz = function (lab) {
	var l = lab[0];
	var a = lab[1];
	var b = lab[2];
	var x;
	var y;
	var z;

	y = (l + 16) / 116;
	x = a / 500 + y;
	z = y - b / 200;

	var y2 = Math.pow(y, 3);
	var x2 = Math.pow(x, 3);
	var z2 = Math.pow(z, 3);
	y = y2 > 0.008856 ? y2 : (y - 16 / 116) / 7.787;
	x = x2 > 0.008856 ? x2 : (x - 16 / 116) / 7.787;
	z = z2 > 0.008856 ? z2 : (z - 16 / 116) / 7.787;

	x *= 95.047;
	y *= 100;
	z *= 108.883;

	return [x, y, z];
};

convert.lab.lch = function (lab) {
	var l = lab[0];
	var a = lab[1];
	var b = lab[2];
	var hr;
	var h;
	var c;

	hr = Math.atan2(b, a);
	h = hr * 360 / 2 / Math.PI;

	if (h < 0) {
		h += 360;
	}

	c = Math.sqrt(a * a + b * b);

	return [l, c, h];
};

convert.lch.lab = function (lch) {
	var l = lch[0];
	var c = lch[1];
	var h = lch[2];
	var a;
	var b;
	var hr;

	hr = h / 360 * 2 * Math.PI;
	a = c * Math.cos(hr);
	b = c * Math.sin(hr);

	return [l, a, b];
};

convert.rgb.ansi16 = function (args) {
	var r = args[0];
	var g = args[1];
	var b = args[2];
	var value = 1 in arguments ? arguments[1] : convert.rgb.hsv(args)[2]; // hsv -> ansi16 optimization

	value = Math.round(value / 50);

	if (value === 0) {
		return 30;
	}

	var ansi = 30
		+ ((Math.round(b / 255) << 2)
		| (Math.round(g / 255) << 1)
		| Math.round(r / 255));

	if (value === 2) {
		ansi += 60;
	}

	return ansi;
};

convert.hsv.ansi16 = function (args) {
	// optimization here; we already know the value and don't need to get
	// it converted for us.
	return convert.rgb.ansi16(convert.hsv.rgb(args), args[2]);
};

convert.rgb.ansi256 = function (args) {
	var r = args[0];
	var g = args[1];
	var b = args[2];

	// we use the extended greyscale palette here, with the exception of
	// black and white. normal palette only has 4 greyscale shades.
	if (r === g && g === b) {
		if (r < 8) {
			return 16;
		}

		if (r > 248) {
			return 231;
		}

		return Math.round(((r - 8) / 247) * 24) + 232;
	}

	var ansi = 16
		+ (36 * Math.round(r / 255 * 5))
		+ (6 * Math.round(g / 255 * 5))
		+ Math.round(b / 255 * 5);

	return ansi;
};

convert.ansi16.rgb = function (args) {
	var color = args % 10;

	// handle greyscale
	if (color === 0 || color === 7) {
		if (args > 50) {
			color += 3.5;
		}

		color = color / 10.5 * 255;

		return [color, color, color];
	}

	var mult = (~~(args > 50) + 1) * 0.5;
	var r = ((color & 1) * mult) * 255;
	var g = (((color >> 1) & 1) * mult) * 255;
	var b = (((color >> 2) & 1) * mult) * 255;

	return [r, g, b];
};

convert.ansi256.rgb = function (args) {
	// handle greyscale
	if (args >= 232) {
		var c = (args - 232) * 10 + 8;
		return [c, c, c];
	}

	args -= 16;

	var rem;
	var r = Math.floor(args / 36) / 5 * 255;
	var g = Math.floor((rem = args % 36) / 6) / 5 * 255;
	var b = (rem % 6) / 5 * 255;

	return [r, g, b];
};

convert.rgb.hex = function (args) {
	var integer = ((Math.round(args[0]) & 0xFF) << 16)
		+ ((Math.round(args[1]) & 0xFF) << 8)
		+ (Math.round(args[2]) & 0xFF);

	var string = integer.toString(16).toUpperCase();
	return '000000'.substring(string.length) + string;
};

convert.hex.rgb = function (args) {
	var match = args.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);
	if (!match) {
		return [0, 0, 0];
	}

	var colorString = match[0];

	if (match[0].length === 3) {
		colorString = colorString.split('').map(function (char) {
			return char + char;
		}).join('');
	}

	var integer = parseInt(colorString, 16);
	var r = (integer >> 16) & 0xFF;
	var g = (integer >> 8) & 0xFF;
	var b = integer & 0xFF;

	return [r, g, b];
};

convert.rgb.hcg = function (rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;
	var max = Math.max(Math.max(r, g), b);
	var min = Math.min(Math.min(r, g), b);
	var chroma = (max - min);
	var grayscale;
	var hue;

	if (chroma < 1) {
		grayscale = min / (1 - chroma);
	} else {
		grayscale = 0;
	}

	if (chroma <= 0) {
		hue = 0;
	} else
	if (max === r) {
		hue = ((g - b) / chroma) % 6;
	} else
	if (max === g) {
		hue = 2 + (b - r) / chroma;
	} else {
		hue = 4 + (r - g) / chroma + 4;
	}

	hue /= 6;
	hue %= 1;

	return [hue * 360, chroma * 100, grayscale * 100];
};

convert.hsl.hcg = function (hsl) {
	var s = hsl[1] / 100;
	var l = hsl[2] / 100;
	var c = 1;
	var f = 0;

	if (l < 0.5) {
		c = 2.0 * s * l;
	} else {
		c = 2.0 * s * (1.0 - l);
	}

	if (c < 1.0) {
		f = (l - 0.5 * c) / (1.0 - c);
	}

	return [hsl[0], c * 100, f * 100];
};

convert.hsv.hcg = function (hsv) {
	var s = hsv[1] / 100;
	var v = hsv[2] / 100;

	var c = s * v;
	var f = 0;

	if (c < 1.0) {
		f = (v - c) / (1 - c);
	}

	return [hsv[0], c * 100, f * 100];
};

convert.hcg.rgb = function (hcg) {
	var h = hcg[0] / 360;
	var c = hcg[1] / 100;
	var g = hcg[2] / 100;

	if (c === 0.0) {
		return [g * 255, g * 255, g * 255];
	}

	var pure = [0, 0, 0];
	var hi = (h % 1) * 6;
	var v = hi % 1;
	var w = 1 - v;
	var mg = 0;

	switch (Math.floor(hi)) {
		case 0:
			pure[0] = 1; pure[1] = v; pure[2] = 0; break;
		case 1:
			pure[0] = w; pure[1] = 1; pure[2] = 0; break;
		case 2:
			pure[0] = 0; pure[1] = 1; pure[2] = v; break;
		case 3:
			pure[0] = 0; pure[1] = w; pure[2] = 1; break;
		case 4:
			pure[0] = v; pure[1] = 0; pure[2] = 1; break;
		default:
			pure[0] = 1; pure[1] = 0; pure[2] = w;
	}

	mg = (1.0 - c) * g;

	return [
		(c * pure[0] + mg) * 255,
		(c * pure[1] + mg) * 255,
		(c * pure[2] + mg) * 255
	];
};

convert.hcg.hsv = function (hcg) {
	var c = hcg[1] / 100;
	var g = hcg[2] / 100;

	var v = c + g * (1.0 - c);
	var f = 0;

	if (v > 0.0) {
		f = c / v;
	}

	return [hcg[0], f * 100, v * 100];
};

convert.hcg.hsl = function (hcg) {
	var c = hcg[1] / 100;
	var g = hcg[2] / 100;

	var l = g * (1.0 - c) + 0.5 * c;
	var s = 0;

	if (l > 0.0 && l < 0.5) {
		s = c / (2 * l);
	} else
	if (l >= 0.5 && l < 1.0) {
		s = c / (2 * (1 - l));
	}

	return [hcg[0], s * 100, l * 100];
};

convert.hcg.hwb = function (hcg) {
	var c = hcg[1] / 100;
	var g = hcg[2] / 100;
	var v = c + g * (1.0 - c);
	return [hcg[0], (v - c) * 100, (1 - v) * 100];
};

convert.hwb.hcg = function (hwb) {
	var w = hwb[1] / 100;
	var b = hwb[2] / 100;
	var v = 1 - b;
	var c = v - w;
	var g = 0;

	if (c < 1) {
		g = (v - c) / (1 - c);
	}

	return [hwb[0], c * 100, g * 100];
};

convert.apple.rgb = function (apple) {
	return [(apple[0] / 65535) * 255, (apple[1] / 65535) * 255, (apple[2] / 65535) * 255];
};

convert.rgb.apple = function (rgb) {
	return [(rgb[0] / 255) * 65535, (rgb[1] / 255) * 65535, (rgb[2] / 255) * 65535];
};

convert.gray.rgb = function (args) {
	return [args[0] / 100 * 255, args[0] / 100 * 255, args[0] / 100 * 255];
};

convert.gray.hsl = convert.gray.hsv = function (args) {
	return [0, 0, args[0]];
};

convert.gray.hwb = function (gray) {
	return [0, 100, gray[0]];
};

convert.gray.cmyk = function (gray) {
	return [0, 0, 0, gray[0]];
};

convert.gray.lab = function (gray) {
	return [gray[0], 0, 0];
};

convert.gray.hex = function (gray) {
	var val = Math.round(gray[0] / 100 * 255) & 0xFF;
	var integer = (val << 16) + (val << 8) + val;

	var string = integer.toString(16).toUpperCase();
	return '000000'.substring(string.length) + string;
};

convert.rgb.gray = function (rgb) {
	var val = (rgb[0] + rgb[1] + rgb[2]) / 3;
	return [val / 255 * 100];
};

},{"color-name":23}],21:[function(require,module,exports){
var conversions = require('./conversions');
var route = require('./route');

var convert = {};

var models = Object.keys(conversions);

function wrapRaw(fn) {
	var wrappedFn = function (args) {
		if (args === undefined || args === null) {
			return args;
		}

		if (arguments.length > 1) {
			args = Array.prototype.slice.call(arguments);
		}

		return fn(args);
	};

	// preserve .conversion property if there is one
	if ('conversion' in fn) {
		wrappedFn.conversion = fn.conversion;
	}

	return wrappedFn;
}

function wrapRounded(fn) {
	var wrappedFn = function (args) {
		if (args === undefined || args === null) {
			return args;
		}

		if (arguments.length > 1) {
			args = Array.prototype.slice.call(arguments);
		}

		var result = fn(args);

		// we're assuming the result is an array here.
		// see notice in conversions.js; don't use box types
		// in conversion functions.
		if (typeof result === 'object') {
			for (var len = result.length, i = 0; i < len; i++) {
				result[i] = Math.round(result[i]);
			}
		}

		return result;
	};

	// preserve .conversion property if there is one
	if ('conversion' in fn) {
		wrappedFn.conversion = fn.conversion;
	}

	return wrappedFn;
}

models.forEach(function (fromModel) {
	convert[fromModel] = {};

	Object.defineProperty(convert[fromModel], 'channels', {value: conversions[fromModel].channels});
	Object.defineProperty(convert[fromModel], 'labels', {value: conversions[fromModel].labels});

	var routes = route(fromModel);
	var routeModels = Object.keys(routes);

	routeModels.forEach(function (toModel) {
		var fn = routes[toModel];

		convert[fromModel][toModel] = wrapRounded(fn);
		convert[fromModel][toModel].raw = wrapRaw(fn);
	});
});

module.exports = convert;

},{"./conversions":20,"./route":22}],22:[function(require,module,exports){
var conversions = require('./conversions');

/*
	this function routes a model to all other models.

	all functions that are routed have a property `.conversion` attached
	to the returned synthetic function. This property is an array
	of strings, each with the steps in between the 'from' and 'to'
	color models (inclusive).

	conversions that are not possible simply are not included.
*/

function buildGraph() {
	var graph = {};
	// https://jsperf.com/object-keys-vs-for-in-with-closure/3
	var models = Object.keys(conversions);

	for (var len = models.length, i = 0; i < len; i++) {
		graph[models[i]] = {
			// http://jsperf.com/1-vs-infinity
			// micro-opt, but this is simple.
			distance: -1,
			parent: null
		};
	}

	return graph;
}

// https://en.wikipedia.org/wiki/Breadth-first_search
function deriveBFS(fromModel) {
	var graph = buildGraph();
	var queue = [fromModel]; // unshift -> queue -> pop

	graph[fromModel].distance = 0;

	while (queue.length) {
		var current = queue.pop();
		var adjacents = Object.keys(conversions[current]);

		for (var len = adjacents.length, i = 0; i < len; i++) {
			var adjacent = adjacents[i];
			var node = graph[adjacent];

			if (node.distance === -1) {
				node.distance = graph[current].distance + 1;
				node.parent = current;
				queue.unshift(adjacent);
			}
		}
	}

	return graph;
}

function link(from, to) {
	return function (args) {
		return to(from(args));
	};
}

function wrapConversion(toModel, graph) {
	var path = [graph[toModel].parent, toModel];
	var fn = conversions[graph[toModel].parent][toModel];

	var cur = graph[toModel].parent;
	while (graph[cur].parent) {
		path.unshift(graph[cur].parent);
		fn = link(conversions[graph[cur].parent][cur], fn);
		cur = graph[cur].parent;
	}

	fn.conversion = path;
	return fn;
}

module.exports = function (fromModel) {
	var graph = deriveBFS(fromModel);
	var conversion = {};

	var models = Object.keys(graph);
	for (var len = models.length, i = 0; i < len; i++) {
		var toModel = models[i];
		var node = graph[toModel];

		if (node.parent === null) {
			// no possible conversion, or this node is the source model.
			continue;
		}

		conversion[toModel] = wrapConversion(toModel, graph);
	}

	return conversion;
};


},{"./conversions":20}],23:[function(require,module,exports){
'use strict'

module.exports = {
	"aliceblue": [240, 248, 255],
	"antiquewhite": [250, 235, 215],
	"aqua": [0, 255, 255],
	"aquamarine": [127, 255, 212],
	"azure": [240, 255, 255],
	"beige": [245, 245, 220],
	"bisque": [255, 228, 196],
	"black": [0, 0, 0],
	"blanchedalmond": [255, 235, 205],
	"blue": [0, 0, 255],
	"blueviolet": [138, 43, 226],
	"brown": [165, 42, 42],
	"burlywood": [222, 184, 135],
	"cadetblue": [95, 158, 160],
	"chartreuse": [127, 255, 0],
	"chocolate": [210, 105, 30],
	"coral": [255, 127, 80],
	"cornflowerblue": [100, 149, 237],
	"cornsilk": [255, 248, 220],
	"crimson": [220, 20, 60],
	"cyan": [0, 255, 255],
	"darkblue": [0, 0, 139],
	"darkcyan": [0, 139, 139],
	"darkgoldenrod": [184, 134, 11],
	"darkgray": [169, 169, 169],
	"darkgreen": [0, 100, 0],
	"darkgrey": [169, 169, 169],
	"darkkhaki": [189, 183, 107],
	"darkmagenta": [139, 0, 139],
	"darkolivegreen": [85, 107, 47],
	"darkorange": [255, 140, 0],
	"darkorchid": [153, 50, 204],
	"darkred": [139, 0, 0],
	"darksalmon": [233, 150, 122],
	"darkseagreen": [143, 188, 143],
	"darkslateblue": [72, 61, 139],
	"darkslategray": [47, 79, 79],
	"darkslategrey": [47, 79, 79],
	"darkturquoise": [0, 206, 209],
	"darkviolet": [148, 0, 211],
	"deeppink": [255, 20, 147],
	"deepskyblue": [0, 191, 255],
	"dimgray": [105, 105, 105],
	"dimgrey": [105, 105, 105],
	"dodgerblue": [30, 144, 255],
	"firebrick": [178, 34, 34],
	"floralwhite": [255, 250, 240],
	"forestgreen": [34, 139, 34],
	"fuchsia": [255, 0, 255],
	"gainsboro": [220, 220, 220],
	"ghostwhite": [248, 248, 255],
	"gold": [255, 215, 0],
	"goldenrod": [218, 165, 32],
	"gray": [128, 128, 128],
	"green": [0, 128, 0],
	"greenyellow": [173, 255, 47],
	"grey": [128, 128, 128],
	"honeydew": [240, 255, 240],
	"hotpink": [255, 105, 180],
	"indianred": [205, 92, 92],
	"indigo": [75, 0, 130],
	"ivory": [255, 255, 240],
	"khaki": [240, 230, 140],
	"lavender": [230, 230, 250],
	"lavenderblush": [255, 240, 245],
	"lawngreen": [124, 252, 0],
	"lemonchiffon": [255, 250, 205],
	"lightblue": [173, 216, 230],
	"lightcoral": [240, 128, 128],
	"lightcyan": [224, 255, 255],
	"lightgoldenrodyellow": [250, 250, 210],
	"lightgray": [211, 211, 211],
	"lightgreen": [144, 238, 144],
	"lightgrey": [211, 211, 211],
	"lightpink": [255, 182, 193],
	"lightsalmon": [255, 160, 122],
	"lightseagreen": [32, 178, 170],
	"lightskyblue": [135, 206, 250],
	"lightslategray": [119, 136, 153],
	"lightslategrey": [119, 136, 153],
	"lightsteelblue": [176, 196, 222],
	"lightyellow": [255, 255, 224],
	"lime": [0, 255, 0],
	"limegreen": [50, 205, 50],
	"linen": [250, 240, 230],
	"magenta": [255, 0, 255],
	"maroon": [128, 0, 0],
	"mediumaquamarine": [102, 205, 170],
	"mediumblue": [0, 0, 205],
	"mediumorchid": [186, 85, 211],
	"mediumpurple": [147, 112, 219],
	"mediumseagreen": [60, 179, 113],
	"mediumslateblue": [123, 104, 238],
	"mediumspringgreen": [0, 250, 154],
	"mediumturquoise": [72, 209, 204],
	"mediumvioletred": [199, 21, 133],
	"midnightblue": [25, 25, 112],
	"mintcream": [245, 255, 250],
	"mistyrose": [255, 228, 225],
	"moccasin": [255, 228, 181],
	"navajowhite": [255, 222, 173],
	"navy": [0, 0, 128],
	"oldlace": [253, 245, 230],
	"olive": [128, 128, 0],
	"olivedrab": [107, 142, 35],
	"orange": [255, 165, 0],
	"orangered": [255, 69, 0],
	"orchid": [218, 112, 214],
	"palegoldenrod": [238, 232, 170],
	"palegreen": [152, 251, 152],
	"paleturquoise": [175, 238, 238],
	"palevioletred": [219, 112, 147],
	"papayawhip": [255, 239, 213],
	"peachpuff": [255, 218, 185],
	"peru": [205, 133, 63],
	"pink": [255, 192, 203],
	"plum": [221, 160, 221],
	"powderblue": [176, 224, 230],
	"purple": [128, 0, 128],
	"rebeccapurple": [102, 51, 153],
	"red": [255, 0, 0],
	"rosybrown": [188, 143, 143],
	"royalblue": [65, 105, 225],
	"saddlebrown": [139, 69, 19],
	"salmon": [250, 128, 114],
	"sandybrown": [244, 164, 96],
	"seagreen": [46, 139, 87],
	"seashell": [255, 245, 238],
	"sienna": [160, 82, 45],
	"silver": [192, 192, 192],
	"skyblue": [135, 206, 235],
	"slateblue": [106, 90, 205],
	"slategray": [112, 128, 144],
	"slategrey": [112, 128, 144],
	"snow": [255, 250, 250],
	"springgreen": [0, 255, 127],
	"steelblue": [70, 130, 180],
	"tan": [210, 180, 140],
	"teal": [0, 128, 128],
	"thistle": [216, 191, 216],
	"tomato": [255, 99, 71],
	"turquoise": [64, 224, 208],
	"violet": [238, 130, 238],
	"wheat": [245, 222, 179],
	"white": [255, 255, 255],
	"whitesmoke": [245, 245, 245],
	"yellow": [255, 255, 0],
	"yellowgreen": [154, 205, 50]
};

},{}],24:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Day Helpers
 * @summary Add the specified number of days to the given date.
 *
 * @description
 * Add the specified number of days to the given date.
 *
 * @param {Date|String|Number} date - the date to be changed
 * @param {Number} amount - the amount of days to be added
 * @returns {Date} the new date with the days added
 *
 * @example
 * // Add 10 days to 1 September 2014:
 * var result = addDays(new Date(2014, 8, 1), 10)
 * //=> Thu Sep 11 2014 00:00:00
 */
function addDays (dirtyDate, dirtyAmount) {
  var date = parse(dirtyDate)
  var amount = Number(dirtyAmount)
  date.setDate(date.getDate() + amount)
  return date
}

module.exports = addDays

},{"../parse/index.js":146}],25:[function(require,module,exports){
var addMilliseconds = require('../add_milliseconds/index.js')

var MILLISECONDS_IN_HOUR = 3600000

/**
 * @category Hour Helpers
 * @summary Add the specified number of hours to the given date.
 *
 * @description
 * Add the specified number of hours to the given date.
 *
 * @param {Date|String|Number} date - the date to be changed
 * @param {Number} amount - the amount of hours to be added
 * @returns {Date} the new date with the hours added
 *
 * @example
 * // Add 2 hours to 10 July 2014 23:00:00:
 * var result = addHours(new Date(2014, 6, 10, 23, 0), 2)
 * //=> Fri Jul 11 2014 01:00:00
 */
function addHours (dirtyDate, dirtyAmount) {
  var amount = Number(dirtyAmount)
  return addMilliseconds(dirtyDate, amount * MILLISECONDS_IN_HOUR)
}

module.exports = addHours

},{"../add_milliseconds/index.js":27}],26:[function(require,module,exports){
var getISOYear = require('../get_iso_year/index.js')
var setISOYear = require('../set_iso_year/index.js')

/**
 * @category ISO Week-Numbering Year Helpers
 * @summary Add the specified number of ISO week-numbering years to the given date.
 *
 * @description
 * Add the specified number of ISO week-numbering years to the given date.
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * @param {Date|String|Number} date - the date to be changed
 * @param {Number} amount - the amount of ISO week-numbering years to be added
 * @returns {Date} the new date with the ISO week-numbering years added
 *
 * @example
 * // Add 5 ISO week-numbering years to 2 July 2010:
 * var result = addISOYears(new Date(2010, 6, 2), 5)
 * //=> Fri Jun 26 2015 00:00:00
 */
function addISOYears (dirtyDate, dirtyAmount) {
  var amount = Number(dirtyAmount)
  return setISOYear(dirtyDate, getISOYear(dirtyDate) + amount)
}

module.exports = addISOYears

},{"../get_iso_year/index.js":83,"../set_iso_year/index.js":153}],27:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Millisecond Helpers
 * @summary Add the specified number of milliseconds to the given date.
 *
 * @description
 * Add the specified number of milliseconds to the given date.
 *
 * @param {Date|String|Number} date - the date to be changed
 * @param {Number} amount - the amount of milliseconds to be added
 * @returns {Date} the new date with the milliseconds added
 *
 * @example
 * // Add 750 milliseconds to 10 July 2014 12:45:30.000:
 * var result = addMilliseconds(new Date(2014, 6, 10, 12, 45, 30, 0), 750)
 * //=> Thu Jul 10 2014 12:45:30.750
 */
function addMilliseconds (dirtyDate, dirtyAmount) {
  var timestamp = parse(dirtyDate).getTime()
  var amount = Number(dirtyAmount)
  return new Date(timestamp + amount)
}

module.exports = addMilliseconds

},{"../parse/index.js":146}],28:[function(require,module,exports){
var addMilliseconds = require('../add_milliseconds/index.js')

var MILLISECONDS_IN_MINUTE = 60000

/**
 * @category Minute Helpers
 * @summary Add the specified number of minutes to the given date.
 *
 * @description
 * Add the specified number of minutes to the given date.
 *
 * @param {Date|String|Number} date - the date to be changed
 * @param {Number} amount - the amount of minutes to be added
 * @returns {Date} the new date with the minutes added
 *
 * @example
 * // Add 30 minutes to 10 July 2014 12:00:00:
 * var result = addMinutes(new Date(2014, 6, 10, 12, 0), 30)
 * //=> Thu Jul 10 2014 12:30:00
 */
function addMinutes (dirtyDate, dirtyAmount) {
  var amount = Number(dirtyAmount)
  return addMilliseconds(dirtyDate, amount * MILLISECONDS_IN_MINUTE)
}

module.exports = addMinutes

},{"../add_milliseconds/index.js":27}],29:[function(require,module,exports){
var parse = require('../parse/index.js')
var getDaysInMonth = require('../get_days_in_month/index.js')

/**
 * @category Month Helpers
 * @summary Add the specified number of months to the given date.
 *
 * @description
 * Add the specified number of months to the given date.
 *
 * @param {Date|String|Number} date - the date to be changed
 * @param {Number} amount - the amount of months to be added
 * @returns {Date} the new date with the months added
 *
 * @example
 * // Add 5 months to 1 September 2014:
 * var result = addMonths(new Date(2014, 8, 1), 5)
 * //=> Sun Feb 01 2015 00:00:00
 */
function addMonths (dirtyDate, dirtyAmount) {
  var date = parse(dirtyDate)
  var amount = Number(dirtyAmount)
  var desiredMonth = date.getMonth() + amount
  var dateWithDesiredMonth = new Date(0)
  dateWithDesiredMonth.setFullYear(date.getFullYear(), desiredMonth, 1)
  dateWithDesiredMonth.setHours(0, 0, 0, 0)
  var daysInMonth = getDaysInMonth(dateWithDesiredMonth)
  // Set the last day of the new month
  // if the original date was the last day of the longer month
  date.setMonth(desiredMonth, Math.min(daysInMonth, date.getDate()))
  return date
}

module.exports = addMonths

},{"../get_days_in_month/index.js":77,"../parse/index.js":146}],30:[function(require,module,exports){
var addMonths = require('../add_months/index.js')

/**
 * @category Quarter Helpers
 * @summary Add the specified number of year quarters to the given date.
 *
 * @description
 * Add the specified number of year quarters to the given date.
 *
 * @param {Date|String|Number} date - the date to be changed
 * @param {Number} amount - the amount of quarters to be added
 * @returns {Date} the new date with the quarters added
 *
 * @example
 * // Add 1 quarter to 1 September 2014:
 * var result = addQuarters(new Date(2014, 8, 1), 1)
 * //=> Mon Dec 01 2014 00:00:00
 */
function addQuarters (dirtyDate, dirtyAmount) {
  var amount = Number(dirtyAmount)
  var months = amount * 3
  return addMonths(dirtyDate, months)
}

module.exports = addQuarters

},{"../add_months/index.js":29}],31:[function(require,module,exports){
var addMilliseconds = require('../add_milliseconds/index.js')

/**
 * @category Second Helpers
 * @summary Add the specified number of seconds to the given date.
 *
 * @description
 * Add the specified number of seconds to the given date.
 *
 * @param {Date|String|Number} date - the date to be changed
 * @param {Number} amount - the amount of seconds to be added
 * @returns {Date} the new date with the seconds added
 *
 * @example
 * // Add 30 seconds to 10 July 2014 12:45:00:
 * var result = addSeconds(new Date(2014, 6, 10, 12, 45, 0), 30)
 * //=> Thu Jul 10 2014 12:45:30
 */
function addSeconds (dirtyDate, dirtyAmount) {
  var amount = Number(dirtyAmount)
  return addMilliseconds(dirtyDate, amount * 1000)
}

module.exports = addSeconds

},{"../add_milliseconds/index.js":27}],32:[function(require,module,exports){
var addDays = require('../add_days/index.js')

/**
 * @category Week Helpers
 * @summary Add the specified number of weeks to the given date.
 *
 * @description
 * Add the specified number of week to the given date.
 *
 * @param {Date|String|Number} date - the date to be changed
 * @param {Number} amount - the amount of weeks to be added
 * @returns {Date} the new date with the weeks added
 *
 * @example
 * // Add 4 weeks to 1 September 2014:
 * var result = addWeeks(new Date(2014, 8, 1), 4)
 * //=> Mon Sep 29 2014 00:00:00
 */
function addWeeks (dirtyDate, dirtyAmount) {
  var amount = Number(dirtyAmount)
  var days = amount * 7
  return addDays(dirtyDate, days)
}

module.exports = addWeeks

},{"../add_days/index.js":24}],33:[function(require,module,exports){
var addMonths = require('../add_months/index.js')

/**
 * @category Year Helpers
 * @summary Add the specified number of years to the given date.
 *
 * @description
 * Add the specified number of years to the given date.
 *
 * @param {Date|String|Number} date - the date to be changed
 * @param {Number} amount - the amount of years to be added
 * @returns {Date} the new date with the years added
 *
 * @example
 * // Add 5 years to 1 September 2014:
 * var result = addYears(new Date(2014, 8, 1), 5)
 * //=> Sun Sep 01 2019 00:00:00
 */
function addYears (dirtyDate, dirtyAmount) {
  var amount = Number(dirtyAmount)
  return addMonths(dirtyDate, amount * 12)
}

module.exports = addYears

},{"../add_months/index.js":29}],34:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Range Helpers
 * @summary Is the given date range overlapping with another date range?
 *
 * @description
 * Is the given date range overlapping with another date range?
 *
 * @param {Date|String|Number} initialRangeStartDate - the start of the initial range
 * @param {Date|String|Number} initialRangeEndDate - the end of the initial range
 * @param {Date|String|Number} comparedRangeStartDate - the start of the range to compare it with
 * @param {Date|String|Number} comparedRangeEndDate - the end of the range to compare it with
 * @returns {Boolean} whether the date ranges are overlapping
 * @throws {Error} startDate of a date range cannot be after its endDate
 *
 * @example
 * // For overlapping date ranges:
 * areRangesOverlapping(
 *   new Date(2014, 0, 10), new Date(2014, 0, 20), new Date(2014, 0, 17), new Date(2014, 0, 21)
 * )
 * //=> true
 *
 * @example
 * // For non-overlapping date ranges:
 * areRangesOverlapping(
 *   new Date(2014, 0, 10), new Date(2014, 0, 20), new Date(2014, 0, 21), new Date(2014, 0, 22)
 * )
 * //=> false
 */
function areRangesOverlapping (dirtyInitialRangeStartDate, dirtyInitialRangeEndDate, dirtyComparedRangeStartDate, dirtyComparedRangeEndDate) {
  var initialStartTime = parse(dirtyInitialRangeStartDate).getTime()
  var initialEndTime = parse(dirtyInitialRangeEndDate).getTime()
  var comparedStartTime = parse(dirtyComparedRangeStartDate).getTime()
  var comparedEndTime = parse(dirtyComparedRangeEndDate).getTime()

  if (initialStartTime > initialEndTime || comparedStartTime > comparedEndTime) {
    throw new Error('The start of the range cannot be after the end of the range')
  }

  return initialStartTime < comparedEndTime && comparedStartTime < initialEndTime
}

module.exports = areRangesOverlapping

},{"../parse/index.js":146}],35:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Common Helpers
 * @summary Return an index of the closest date from the array comparing to the given date.
 *
 * @description
 * Return an index of the closest date from the array comparing to the given date.
 *
 * @param {Date|String|Number} dateToCompare - the date to compare with
 * @param {Date[]|String[]|Number[]} datesArray - the array to search
 * @returns {Number} an index of the date closest to the given date
 * @throws {TypeError} the second argument must be an instance of Array
 *
 * @example
 * // Which date is closer to 6 September 2015?
 * var dateToCompare = new Date(2015, 8, 6)
 * var datesArray = [
 *   new Date(2015, 0, 1),
 *   new Date(2016, 0, 1),
 *   new Date(2017, 0, 1)
 * ]
 * var result = closestIndexTo(dateToCompare, datesArray)
 * //=> 1
 */
function closestIndexTo (dirtyDateToCompare, dirtyDatesArray) {
  if (!(dirtyDatesArray instanceof Array)) {
    throw new TypeError(toString.call(dirtyDatesArray) + ' is not an instance of Array')
  }

  var dateToCompare = parse(dirtyDateToCompare)
  var timeToCompare = dateToCompare.getTime()

  var result
  var minDistance

  dirtyDatesArray.forEach(function (dirtyDate, index) {
    var currentDate = parse(dirtyDate)
    var distance = Math.abs(timeToCompare - currentDate.getTime())
    if (result === undefined || distance < minDistance) {
      result = index
      minDistance = distance
    }
  })

  return result
}

module.exports = closestIndexTo

},{"../parse/index.js":146}],36:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Common Helpers
 * @summary Return a date from the array closest to the given date.
 *
 * @description
 * Return a date from the array closest to the given date.
 *
 * @param {Date|String|Number} dateToCompare - the date to compare with
 * @param {Date[]|String[]|Number[]} datesArray - the array to search
 * @returns {Date} the date from the array closest to the given date
 * @throws {TypeError} the second argument must be an instance of Array
 *
 * @example
 * // Which date is closer to 6 September 2015: 1 January 2000 or 1 January 2030?
 * var dateToCompare = new Date(2015, 8, 6)
 * var result = closestTo(dateToCompare, [
 *   new Date(2000, 0, 1),
 *   new Date(2030, 0, 1)
 * ])
 * //=> Tue Jan 01 2030 00:00:00
 */
function closestTo (dirtyDateToCompare, dirtyDatesArray) {
  if (!(dirtyDatesArray instanceof Array)) {
    throw new TypeError(toString.call(dirtyDatesArray) + ' is not an instance of Array')
  }

  var dateToCompare = parse(dirtyDateToCompare)
  var timeToCompare = dateToCompare.getTime()

  var result
  var minDistance

  dirtyDatesArray.forEach(function (dirtyDate) {
    var currentDate = parse(dirtyDate)
    var distance = Math.abs(timeToCompare - currentDate.getTime())
    if (result === undefined || distance < minDistance) {
      result = currentDate
      minDistance = distance
    }
  })

  return result
}

module.exports = closestTo

},{"../parse/index.js":146}],37:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Common Helpers
 * @summary Compare the two dates and return -1, 0 or 1.
 *
 * @description
 * Compare the two dates and return 1 if the first date is after the second,
 * -1 if the first date is before the second or 0 if dates are equal.
 *
 * @param {Date|String|Number} dateLeft - the first date to compare
 * @param {Date|String|Number} dateRight - the second date to compare
 * @returns {Number} the result of the comparison
 *
 * @example
 * // Compare 11 February 1987 and 10 July 1989:
 * var result = compareAsc(
 *   new Date(1987, 1, 11),
 *   new Date(1989, 6, 10)
 * )
 * //=> -1
 *
 * @example
 * // Sort the array of dates:
 * var result = [
 *   new Date(1995, 6, 2),
 *   new Date(1987, 1, 11),
 *   new Date(1989, 6, 10)
 * ].sort(compareAsc)
 * //=> [
 * //   Wed Feb 11 1987 00:00:00,
 * //   Mon Jul 10 1989 00:00:00,
 * //   Sun Jul 02 1995 00:00:00
 * // ]
 */
function compareAsc (dirtyDateLeft, dirtyDateRight) {
  var dateLeft = parse(dirtyDateLeft)
  var timeLeft = dateLeft.getTime()
  var dateRight = parse(dirtyDateRight)
  var timeRight = dateRight.getTime()

  if (timeLeft < timeRight) {
    return -1
  } else if (timeLeft > timeRight) {
    return 1
  } else {
    return 0
  }
}

module.exports = compareAsc

},{"../parse/index.js":146}],38:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Common Helpers
 * @summary Compare the two dates reverse chronologically and return -1, 0 or 1.
 *
 * @description
 * Compare the two dates and return -1 if the first date is after the second,
 * 1 if the first date is before the second or 0 if dates are equal.
 *
 * @param {Date|String|Number} dateLeft - the first date to compare
 * @param {Date|String|Number} dateRight - the second date to compare
 * @returns {Number} the result of the comparison
 *
 * @example
 * // Compare 11 February 1987 and 10 July 1989 reverse chronologically:
 * var result = compareDesc(
 *   new Date(1987, 1, 11),
 *   new Date(1989, 6, 10)
 * )
 * //=> 1
 *
 * @example
 * // Sort the array of dates in reverse chronological order:
 * var result = [
 *   new Date(1995, 6, 2),
 *   new Date(1987, 1, 11),
 *   new Date(1989, 6, 10)
 * ].sort(compareDesc)
 * //=> [
 * //   Sun Jul 02 1995 00:00:00,
 * //   Mon Jul 10 1989 00:00:00,
 * //   Wed Feb 11 1987 00:00:00
 * // ]
 */
function compareDesc (dirtyDateLeft, dirtyDateRight) {
  var dateLeft = parse(dirtyDateLeft)
  var timeLeft = dateLeft.getTime()
  var dateRight = parse(dirtyDateRight)
  var timeRight = dateRight.getTime()

  if (timeLeft > timeRight) {
    return -1
  } else if (timeLeft < timeRight) {
    return 1
  } else {
    return 0
  }
}

module.exports = compareDesc

},{"../parse/index.js":146}],39:[function(require,module,exports){
var startOfDay = require('../start_of_day/index.js')

var MILLISECONDS_IN_MINUTE = 60000
var MILLISECONDS_IN_DAY = 86400000

/**
 * @category Day Helpers
 * @summary Get the number of calendar days between the given dates.
 *
 * @description
 * Get the number of calendar days between the given dates.
 *
 * @param {Date|String|Number} dateLeft - the later date
 * @param {Date|String|Number} dateRight - the earlier date
 * @returns {Number} the number of calendar days
 *
 * @example
 * // How many calendar days are between
 * // 2 July 2011 23:00:00 and 2 July 2012 00:00:00?
 * var result = differenceInCalendarDays(
 *   new Date(2012, 6, 2, 0, 0),
 *   new Date(2011, 6, 2, 23, 0)
 * )
 * //=> 366
 */
function differenceInCalendarDays (dirtyDateLeft, dirtyDateRight) {
  var startOfDayLeft = startOfDay(dirtyDateLeft)
  var startOfDayRight = startOfDay(dirtyDateRight)

  var timestampLeft = startOfDayLeft.getTime() -
    startOfDayLeft.getTimezoneOffset() * MILLISECONDS_IN_MINUTE
  var timestampRight = startOfDayRight.getTime() -
    startOfDayRight.getTimezoneOffset() * MILLISECONDS_IN_MINUTE

  // Round the number of days to the nearest integer
  // because the number of milliseconds in a day is not constant
  // (e.g. it's different in the day of the daylight saving time clock shift)
  return Math.round((timestampLeft - timestampRight) / MILLISECONDS_IN_DAY)
}

module.exports = differenceInCalendarDays

},{"../start_of_day/index.js":160}],40:[function(require,module,exports){
var startOfISOWeek = require('../start_of_iso_week/index.js')

var MILLISECONDS_IN_MINUTE = 60000
var MILLISECONDS_IN_WEEK = 604800000

/**
 * @category ISO Week Helpers
 * @summary Get the number of calendar ISO weeks between the given dates.
 *
 * @description
 * Get the number of calendar ISO weeks between the given dates.
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * @param {Date|String|Number} dateLeft - the later date
 * @param {Date|String|Number} dateRight - the earlier date
 * @returns {Number} the number of calendar ISO weeks
 *
 * @example
 * // How many calendar ISO weeks are between 6 July 2014 and 21 July 2014?
 * var result = differenceInCalendarISOWeeks(
 *   new Date(2014, 6, 21),
 *   new Date(2014, 6, 6)
 * )
 * //=> 3
 */
function differenceInCalendarISOWeeks (dirtyDateLeft, dirtyDateRight) {
  var startOfISOWeekLeft = startOfISOWeek(dirtyDateLeft)
  var startOfISOWeekRight = startOfISOWeek(dirtyDateRight)

  var timestampLeft = startOfISOWeekLeft.getTime() -
    startOfISOWeekLeft.getTimezoneOffset() * MILLISECONDS_IN_MINUTE
  var timestampRight = startOfISOWeekRight.getTime() -
    startOfISOWeekRight.getTimezoneOffset() * MILLISECONDS_IN_MINUTE

  // Round the number of days to the nearest integer
  // because the number of milliseconds in a week is not constant
  // (e.g. it's different in the week of the daylight saving time clock shift)
  return Math.round((timestampLeft - timestampRight) / MILLISECONDS_IN_WEEK)
}

module.exports = differenceInCalendarISOWeeks

},{"../start_of_iso_week/index.js":162}],41:[function(require,module,exports){
var getISOYear = require('../get_iso_year/index.js')

/**
 * @category ISO Week-Numbering Year Helpers
 * @summary Get the number of calendar ISO week-numbering years between the given dates.
 *
 * @description
 * Get the number of calendar ISO week-numbering years between the given dates.
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * @param {Date|String|Number} dateLeft - the later date
 * @param {Date|String|Number} dateRight - the earlier date
 * @returns {Number} the number of calendar ISO week-numbering years
 *
 * @example
 * // How many calendar ISO week-numbering years are 1 January 2010 and 1 January 2012?
 * var result = differenceInCalendarISOYears(
 *   new Date(2012, 0, 1),
 *   new Date(2010, 0, 1)
 * )
 * //=> 2
 */
function differenceInCalendarISOYears (dirtyDateLeft, dirtyDateRight) {
  return getISOYear(dirtyDateLeft) - getISOYear(dirtyDateRight)
}

module.exports = differenceInCalendarISOYears

},{"../get_iso_year/index.js":83}],42:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Month Helpers
 * @summary Get the number of calendar months between the given dates.
 *
 * @description
 * Get the number of calendar months between the given dates.
 *
 * @param {Date|String|Number} dateLeft - the later date
 * @param {Date|String|Number} dateRight - the earlier date
 * @returns {Number} the number of calendar months
 *
 * @example
 * // How many calendar months are between 31 January 2014 and 1 September 2014?
 * var result = differenceInCalendarMonths(
 *   new Date(2014, 8, 1),
 *   new Date(2014, 0, 31)
 * )
 * //=> 8
 */
function differenceInCalendarMonths (dirtyDateLeft, dirtyDateRight) {
  var dateLeft = parse(dirtyDateLeft)
  var dateRight = parse(dirtyDateRight)

  var yearDiff = dateLeft.getFullYear() - dateRight.getFullYear()
  var monthDiff = dateLeft.getMonth() - dateRight.getMonth()

  return yearDiff * 12 + monthDiff
}

module.exports = differenceInCalendarMonths

},{"../parse/index.js":146}],43:[function(require,module,exports){
var getQuarter = require('../get_quarter/index.js')
var parse = require('../parse/index.js')

/**
 * @category Quarter Helpers
 * @summary Get the number of calendar quarters between the given dates.
 *
 * @description
 * Get the number of calendar quarters between the given dates.
 *
 * @param {Date|String|Number} dateLeft - the later date
 * @param {Date|String|Number} dateRight - the earlier date
 * @returns {Number} the number of calendar quarters
 *
 * @example
 * // How many calendar quarters are between 31 December 2013 and 2 July 2014?
 * var result = differenceInCalendarQuarters(
 *   new Date(2014, 6, 2),
 *   new Date(2013, 11, 31)
 * )
 * //=> 3
 */
function differenceInCalendarQuarters (dirtyDateLeft, dirtyDateRight) {
  var dateLeft = parse(dirtyDateLeft)
  var dateRight = parse(dirtyDateRight)

  var yearDiff = dateLeft.getFullYear() - dateRight.getFullYear()
  var quarterDiff = getQuarter(dateLeft) - getQuarter(dateRight)

  return yearDiff * 4 + quarterDiff
}

module.exports = differenceInCalendarQuarters

},{"../get_quarter/index.js":88,"../parse/index.js":146}],44:[function(require,module,exports){
var startOfWeek = require('../start_of_week/index.js')

var MILLISECONDS_IN_MINUTE = 60000
var MILLISECONDS_IN_WEEK = 604800000

/**
 * @category Week Helpers
 * @summary Get the number of calendar weeks between the given dates.
 *
 * @description
 * Get the number of calendar weeks between the given dates.
 *
 * @param {Date|String|Number} dateLeft - the later date
 * @param {Date|String|Number} dateRight - the earlier date
 * @param {Object} [options] - the object with options
 * @param {Number} [options.weekStartsOn=0] - the index of the first day of the week (0 - Sunday)
 * @returns {Number} the number of calendar weeks
 *
 * @example
 * // How many calendar weeks are between 5 July 2014 and 20 July 2014?
 * var result = differenceInCalendarWeeks(
 *   new Date(2014, 6, 20),
 *   new Date(2014, 6, 5)
 * )
 * //=> 3
 *
 * @example
 * // If the week starts on Monday,
 * // how many calendar weeks are between 5 July 2014 and 20 July 2014?
 * var result = differenceInCalendarWeeks(
 *   new Date(2014, 6, 20),
 *   new Date(2014, 6, 5),
 *   {weekStartsOn: 1}
 * )
 * //=> 2
 */
function differenceInCalendarWeeks (dirtyDateLeft, dirtyDateRight, dirtyOptions) {
  var startOfWeekLeft = startOfWeek(dirtyDateLeft, dirtyOptions)
  var startOfWeekRight = startOfWeek(dirtyDateRight, dirtyOptions)

  var timestampLeft = startOfWeekLeft.getTime() -
    startOfWeekLeft.getTimezoneOffset() * MILLISECONDS_IN_MINUTE
  var timestampRight = startOfWeekRight.getTime() -
    startOfWeekRight.getTimezoneOffset() * MILLISECONDS_IN_MINUTE

  // Round the number of days to the nearest integer
  // because the number of milliseconds in a week is not constant
  // (e.g. it's different in the week of the daylight saving time clock shift)
  return Math.round((timestampLeft - timestampRight) / MILLISECONDS_IN_WEEK)
}

module.exports = differenceInCalendarWeeks

},{"../start_of_week/index.js":170}],45:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Year Helpers
 * @summary Get the number of calendar years between the given dates.
 *
 * @description
 * Get the number of calendar years between the given dates.
 *
 * @param {Date|String|Number} dateLeft - the later date
 * @param {Date|String|Number} dateRight - the earlier date
 * @returns {Number} the number of calendar years
 *
 * @example
 * // How many calendar years are between 31 December 2013 and 11 February 2015?
 * var result = differenceInCalendarYears(
 *   new Date(2015, 1, 11),
 *   new Date(2013, 11, 31)
 * )
 * //=> 2
 */
function differenceInCalendarYears (dirtyDateLeft, dirtyDateRight) {
  var dateLeft = parse(dirtyDateLeft)
  var dateRight = parse(dirtyDateRight)

  return dateLeft.getFullYear() - dateRight.getFullYear()
}

module.exports = differenceInCalendarYears

},{"../parse/index.js":146}],46:[function(require,module,exports){
var parse = require('../parse/index.js')
var differenceInCalendarDays = require('../difference_in_calendar_days/index.js')
var compareAsc = require('../compare_asc/index.js')

/**
 * @category Day Helpers
 * @summary Get the number of full days between the given dates.
 *
 * @description
 * Get the number of full days between the given dates.
 *
 * @param {Date|String|Number} dateLeft - the later date
 * @param {Date|String|Number} dateRight - the earlier date
 * @returns {Number} the number of full days
 *
 * @example
 * // How many full days are between
 * // 2 July 2011 23:00:00 and 2 July 2012 00:00:00?
 * var result = differenceInDays(
 *   new Date(2012, 6, 2, 0, 0),
 *   new Date(2011, 6, 2, 23, 0)
 * )
 * //=> 365
 */
function differenceInDays (dirtyDateLeft, dirtyDateRight) {
  var dateLeft = parse(dirtyDateLeft)
  var dateRight = parse(dirtyDateRight)

  var sign = compareAsc(dateLeft, dateRight)
  var difference = Math.abs(differenceInCalendarDays(dateLeft, dateRight))
  dateLeft.setDate(dateLeft.getDate() - sign * difference)

  // Math.abs(diff in full days - diff in calendar days) === 1 if last calendar day is not full
  // If so, result must be decreased by 1 in absolute value
  var isLastDayNotFull = compareAsc(dateLeft, dateRight) === -sign
  return sign * (difference - isLastDayNotFull)
}

module.exports = differenceInDays

},{"../compare_asc/index.js":37,"../difference_in_calendar_days/index.js":39,"../parse/index.js":146}],47:[function(require,module,exports){
var differenceInMilliseconds = require('../difference_in_milliseconds/index.js')

var MILLISECONDS_IN_HOUR = 3600000

/**
 * @category Hour Helpers
 * @summary Get the number of hours between the given dates.
 *
 * @description
 * Get the number of hours between the given dates.
 *
 * @param {Date|String|Number} dateLeft - the later date
 * @param {Date|String|Number} dateRight - the earlier date
 * @returns {Number} the number of hours
 *
 * @example
 * // How many hours are between 2 July 2014 06:50:00 and 2 July 2014 19:00:00?
 * var result = differenceInHours(
 *   new Date(2014, 6, 2, 19, 0),
 *   new Date(2014, 6, 2, 6, 50)
 * )
 * //=> 12
 */
function differenceInHours (dirtyDateLeft, dirtyDateRight) {
  var diff = differenceInMilliseconds(dirtyDateLeft, dirtyDateRight) / MILLISECONDS_IN_HOUR
  return diff > 0 ? Math.floor(diff) : Math.ceil(diff)
}

module.exports = differenceInHours

},{"../difference_in_milliseconds/index.js":49}],48:[function(require,module,exports){
var parse = require('../parse/index.js')
var differenceInCalendarISOYears = require('../difference_in_calendar_iso_years/index.js')
var compareAsc = require('../compare_asc/index.js')
var subISOYears = require('../sub_iso_years/index.js')

/**
 * @category ISO Week-Numbering Year Helpers
 * @summary Get the number of full ISO week-numbering years between the given dates.
 *
 * @description
 * Get the number of full ISO week-numbering years between the given dates.
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * @param {Date|String|Number} dateLeft - the later date
 * @param {Date|String|Number} dateRight - the earlier date
 * @returns {Number} the number of full ISO week-numbering years
 *
 * @example
 * // How many full ISO week-numbering years are between 1 January 2010 and 1 January 2012?
 * var result = differenceInISOYears(
 *   new Date(2012, 0, 1),
 *   new Date(2010, 0, 1)
 * )
 * //=> 1
 */
function differenceInISOYears (dirtyDateLeft, dirtyDateRight) {
  var dateLeft = parse(dirtyDateLeft)
  var dateRight = parse(dirtyDateRight)

  var sign = compareAsc(dateLeft, dateRight)
  var difference = Math.abs(differenceInCalendarISOYears(dateLeft, dateRight))
  dateLeft = subISOYears(dateLeft, sign * difference)

  // Math.abs(diff in full ISO years - diff in calendar ISO years) === 1
  // if last calendar ISO year is not full
  // If so, result must be decreased by 1 in absolute value
  var isLastISOYearNotFull = compareAsc(dateLeft, dateRight) === -sign
  return sign * (difference - isLastISOYearNotFull)
}

module.exports = differenceInISOYears

},{"../compare_asc/index.js":37,"../difference_in_calendar_iso_years/index.js":41,"../parse/index.js":146,"../sub_iso_years/index.js":175}],49:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Millisecond Helpers
 * @summary Get the number of milliseconds between the given dates.
 *
 * @description
 * Get the number of milliseconds between the given dates.
 *
 * @param {Date|String|Number} dateLeft - the later date
 * @param {Date|String|Number} dateRight - the earlier date
 * @returns {Number} the number of milliseconds
 *
 * @example
 * // How many milliseconds are between
 * // 2 July 2014 12:30:20.600 and 2 July 2014 12:30:21.700?
 * var result = differenceInMilliseconds(
 *   new Date(2014, 6, 2, 12, 30, 21, 700),
 *   new Date(2014, 6, 2, 12, 30, 20, 600)
 * )
 * //=> 1100
 */
function differenceInMilliseconds (dirtyDateLeft, dirtyDateRight) {
  var dateLeft = parse(dirtyDateLeft)
  var dateRight = parse(dirtyDateRight)
  return dateLeft.getTime() - dateRight.getTime()
}

module.exports = differenceInMilliseconds

},{"../parse/index.js":146}],50:[function(require,module,exports){
var differenceInMilliseconds = require('../difference_in_milliseconds/index.js')

var MILLISECONDS_IN_MINUTE = 60000

/**
 * @category Minute Helpers
 * @summary Get the number of minutes between the given dates.
 *
 * @description
 * Get the number of minutes between the given dates.
 *
 * @param {Date|String|Number} dateLeft - the later date
 * @param {Date|String|Number} dateRight - the earlier date
 * @returns {Number} the number of minutes
 *
 * @example
 * // How many minutes are between 2 July 2014 12:07:59 and 2 July 2014 12:20:00?
 * var result = differenceInMinutes(
 *   new Date(2014, 6, 2, 12, 20, 0),
 *   new Date(2014, 6, 2, 12, 7, 59)
 * )
 * //=> 12
 */
function differenceInMinutes (dirtyDateLeft, dirtyDateRight) {
  var diff = differenceInMilliseconds(dirtyDateLeft, dirtyDateRight) / MILLISECONDS_IN_MINUTE
  return diff > 0 ? Math.floor(diff) : Math.ceil(diff)
}

module.exports = differenceInMinutes

},{"../difference_in_milliseconds/index.js":49}],51:[function(require,module,exports){
var parse = require('../parse/index.js')
var differenceInCalendarMonths = require('../difference_in_calendar_months/index.js')
var compareAsc = require('../compare_asc/index.js')

/**
 * @category Month Helpers
 * @summary Get the number of full months between the given dates.
 *
 * @description
 * Get the number of full months between the given dates.
 *
 * @param {Date|String|Number} dateLeft - the later date
 * @param {Date|String|Number} dateRight - the earlier date
 * @returns {Number} the number of full months
 *
 * @example
 * // How many full months are between 31 January 2014 and 1 September 2014?
 * var result = differenceInMonths(
 *   new Date(2014, 8, 1),
 *   new Date(2014, 0, 31)
 * )
 * //=> 7
 */
function differenceInMonths (dirtyDateLeft, dirtyDateRight) {
  var dateLeft = parse(dirtyDateLeft)
  var dateRight = parse(dirtyDateRight)

  var sign = compareAsc(dateLeft, dateRight)
  var difference = Math.abs(differenceInCalendarMonths(dateLeft, dateRight))
  dateLeft.setMonth(dateLeft.getMonth() - sign * difference)

  // Math.abs(diff in full months - diff in calendar months) === 1 if last calendar month is not full
  // If so, result must be decreased by 1 in absolute value
  var isLastMonthNotFull = compareAsc(dateLeft, dateRight) === -sign
  return sign * (difference - isLastMonthNotFull)
}

module.exports = differenceInMonths

},{"../compare_asc/index.js":37,"../difference_in_calendar_months/index.js":42,"../parse/index.js":146}],52:[function(require,module,exports){
var differenceInMonths = require('../difference_in_months/index.js')

/**
 * @category Quarter Helpers
 * @summary Get the number of full quarters between the given dates.
 *
 * @description
 * Get the number of full quarters between the given dates.
 *
 * @param {Date|String|Number} dateLeft - the later date
 * @param {Date|String|Number} dateRight - the earlier date
 * @returns {Number} the number of full quarters
 *
 * @example
 * // How many full quarters are between 31 December 2013 and 2 July 2014?
 * var result = differenceInQuarters(
 *   new Date(2014, 6, 2),
 *   new Date(2013, 11, 31)
 * )
 * //=> 2
 */
function differenceInQuarters (dirtyDateLeft, dirtyDateRight) {
  var diff = differenceInMonths(dirtyDateLeft, dirtyDateRight) / 3
  return diff > 0 ? Math.floor(diff) : Math.ceil(diff)
}

module.exports = differenceInQuarters

},{"../difference_in_months/index.js":51}],53:[function(require,module,exports){
var differenceInMilliseconds = require('../difference_in_milliseconds/index.js')

/**
 * @category Second Helpers
 * @summary Get the number of seconds between the given dates.
 *
 * @description
 * Get the number of seconds between the given dates.
 *
 * @param {Date|String|Number} dateLeft - the later date
 * @param {Date|String|Number} dateRight - the earlier date
 * @returns {Number} the number of seconds
 *
 * @example
 * // How many seconds are between
 * // 2 July 2014 12:30:07.999 and 2 July 2014 12:30:20.000?
 * var result = differenceInSeconds(
 *   new Date(2014, 6, 2, 12, 30, 20, 0),
 *   new Date(2014, 6, 2, 12, 30, 7, 999)
 * )
 * //=> 12
 */
function differenceInSeconds (dirtyDateLeft, dirtyDateRight) {
  var diff = differenceInMilliseconds(dirtyDateLeft, dirtyDateRight) / 1000
  return diff > 0 ? Math.floor(diff) : Math.ceil(diff)
}

module.exports = differenceInSeconds

},{"../difference_in_milliseconds/index.js":49}],54:[function(require,module,exports){
var differenceInDays = require('../difference_in_days/index.js')

/**
 * @category Week Helpers
 * @summary Get the number of full weeks between the given dates.
 *
 * @description
 * Get the number of full weeks between the given dates.
 *
 * @param {Date|String|Number} dateLeft - the later date
 * @param {Date|String|Number} dateRight - the earlier date
 * @returns {Number} the number of full weeks
 *
 * @example
 * // How many full weeks are between 5 July 2014 and 20 July 2014?
 * var result = differenceInWeeks(
 *   new Date(2014, 6, 20),
 *   new Date(2014, 6, 5)
 * )
 * //=> 2
 */
function differenceInWeeks (dirtyDateLeft, dirtyDateRight) {
  var diff = differenceInDays(dirtyDateLeft, dirtyDateRight) / 7
  return diff > 0 ? Math.floor(diff) : Math.ceil(diff)
}

module.exports = differenceInWeeks

},{"../difference_in_days/index.js":46}],55:[function(require,module,exports){
var parse = require('../parse/index.js')
var differenceInCalendarYears = require('../difference_in_calendar_years/index.js')
var compareAsc = require('../compare_asc/index.js')

/**
 * @category Year Helpers
 * @summary Get the number of full years between the given dates.
 *
 * @description
 * Get the number of full years between the given dates.
 *
 * @param {Date|String|Number} dateLeft - the later date
 * @param {Date|String|Number} dateRight - the earlier date
 * @returns {Number} the number of full years
 *
 * @example
 * // How many full years are between 31 December 2013 and 11 February 2015?
 * var result = differenceInYears(
 *   new Date(2015, 1, 11),
 *   new Date(2013, 11, 31)
 * )
 * //=> 1
 */
function differenceInYears (dirtyDateLeft, dirtyDateRight) {
  var dateLeft = parse(dirtyDateLeft)
  var dateRight = parse(dirtyDateRight)

  var sign = compareAsc(dateLeft, dateRight)
  var difference = Math.abs(differenceInCalendarYears(dateLeft, dateRight))
  dateLeft.setFullYear(dateLeft.getFullYear() - sign * difference)

  // Math.abs(diff in full years - diff in calendar years) === 1 if last calendar year is not full
  // If so, result must be decreased by 1 in absolute value
  var isLastYearNotFull = compareAsc(dateLeft, dateRight) === -sign
  return sign * (difference - isLastYearNotFull)
}

module.exports = differenceInYears

},{"../compare_asc/index.js":37,"../difference_in_calendar_years/index.js":45,"../parse/index.js":146}],56:[function(require,module,exports){
var compareDesc = require('../compare_desc/index.js')
var parse = require('../parse/index.js')
var differenceInSeconds = require('../difference_in_seconds/index.js')
var differenceInMonths = require('../difference_in_months/index.js')
var enLocale = require('../locale/en/index.js')

var MINUTES_IN_DAY = 1440
var MINUTES_IN_ALMOST_TWO_DAYS = 2520
var MINUTES_IN_MONTH = 43200
var MINUTES_IN_TWO_MONTHS = 86400

/**
 * @category Common Helpers
 * @summary Return the distance between the given dates in words.
 *
 * @description
 * Return the distance between the given dates in words.
 *
 * | Distance between dates                                            | Result              |
 * |-------------------------------------------------------------------|---------------------|
 * | 0 ... 30 secs                                                     | less than a minute  |
 * | 30 secs ... 1 min 30 secs                                         | 1 minute            |
 * | 1 min 30 secs ... 44 mins 30 secs                                 | [2..44] minutes     |
 * | 44 mins ... 30 secs ... 89 mins 30 secs                           | about 1 hour        |
 * | 89 mins 30 secs ... 23 hrs 59 mins 30 secs                        | about [2..24] hours |
 * | 23 hrs 59 mins 30 secs ... 41 hrs 59 mins 30 secs                 | 1 day               |
 * | 41 hrs 59 mins 30 secs ... 29 days 23 hrs 59 mins 30 secs         | [2..30] days        |
 * | 29 days 23 hrs 59 mins 30 secs ... 44 days 23 hrs 59 mins 30 secs | about 1 month       |
 * | 44 days 23 hrs 59 mins 30 secs ... 59 days 23 hrs 59 mins 30 secs | about 2 months      |
 * | 59 days 23 hrs 59 mins 30 secs ... 1 yr                           | [2..12] months      |
 * | 1 yr ... 1 yr 3 months                                            | about 1 year        |
 * | 1 yr 3 months ... 1 yr 9 month s                                  | over 1 year         |
 * | 1 yr 9 months ... 2 yrs                                           | almost 2 years      |
 * | N yrs ... N yrs 3 months                                          | about N years       |
 * | N yrs 3 months ... N yrs 9 months                                 | over N years        |
 * | N yrs 9 months ... N+1 yrs                                        | almost N+1 years    |
 *
 * With `options.includeSeconds == true`:
 * | Distance between dates | Result               |
 * |------------------------|----------------------|
 * | 0 secs ... 5 secs      | less than 5 seconds  |
 * | 5 secs ... 10 secs     | less than 10 seconds |
 * | 10 secs ... 20 secs    | less than 20 seconds |
 * | 20 secs ... 40 secs    | half a minute        |
 * | 40 secs ... 60 secs    | less than a minute   |
 * | 60 secs ... 90 secs    | 1 minute             |
 *
 * @param {Date|String|Number} dateToCompare - the date to compare with
 * @param {Date|String|Number} date - the other date
 * @param {Object} [options] - the object with options
 * @param {Boolean} [options.includeSeconds=false] - distances less than a minute are more detailed
 * @param {Boolean} [options.addSuffix=false] - result indicates if the second date is earlier or later than the first
 * @param {Object} [options.locale=enLocale] - the locale object
 * @returns {String} the distance in words
 *
 * @example
 * // What is the distance between 2 July 2014 and 1 January 2015?
 * var result = distanceInWords(
 *   new Date(2014, 6, 2),
 *   new Date(2015, 0, 1)
 * )
 * //=> '6 months'
 *
 * @example
 * // What is the distance between 1 January 2015 00:00:15
 * // and 1 January 2015 00:00:00, including seconds?
 * var result = distanceInWords(
 *   new Date(2015, 0, 1, 0, 0, 15),
 *   new Date(2015, 0, 1, 0, 0, 0),
 *   {includeSeconds: true}
 * )
 * //=> 'less than 20 seconds'
 *
 * @example
 * // What is the distance from 1 January 2016
 * // to 1 January 2015, with a suffix?
 * var result = distanceInWords(
 *   new Date(2016, 0, 1),
 *   new Date(2015, 0, 1),
 *   {addSuffix: true}
 * )
 * //=> 'about 1 year ago'
 *
 * @example
 * // What is the distance between 1 August 2016 and 1 January 2015 in Esperanto?
 * var eoLocale = require('date-fns/locale/eo')
 * var result = distanceInWords(
 *   new Date(2016, 7, 1),
 *   new Date(2015, 0, 1),
 *   {locale: eoLocale}
 * )
 * //=> 'pli ol 1 jaro'
 */
function distanceInWords (dirtyDateToCompare, dirtyDate, dirtyOptions) {
  var options = dirtyOptions || {}

  var comparison = compareDesc(dirtyDateToCompare, dirtyDate)

  var locale = options.locale
  var localize = enLocale.distanceInWords.localize
  if (locale && locale.distanceInWords && locale.distanceInWords.localize) {
    localize = locale.distanceInWords.localize
  }

  var localizeOptions = {
    addSuffix: Boolean(options.addSuffix),
    comparison: comparison
  }

  var dateLeft, dateRight
  if (comparison > 0) {
    dateLeft = parse(dirtyDateToCompare)
    dateRight = parse(dirtyDate)
  } else {
    dateLeft = parse(dirtyDate)
    dateRight = parse(dirtyDateToCompare)
  }

  var seconds = differenceInSeconds(dateRight, dateLeft)
  var offset = dateRight.getTimezoneOffset() - dateLeft.getTimezoneOffset()
  var minutes = Math.round(seconds / 60) - offset
  var months

  // 0 up to 2 mins
  if (minutes < 2) {
    if (options.includeSeconds) {
      if (seconds < 5) {
        return localize('lessThanXSeconds', 5, localizeOptions)
      } else if (seconds < 10) {
        return localize('lessThanXSeconds', 10, localizeOptions)
      } else if (seconds < 20) {
        return localize('lessThanXSeconds', 20, localizeOptions)
      } else if (seconds < 40) {
        return localize('halfAMinute', null, localizeOptions)
      } else if (seconds < 60) {
        return localize('lessThanXMinutes', 1, localizeOptions)
      } else {
        return localize('xMinutes', 1, localizeOptions)
      }
    } else {
      if (minutes === 0) {
        return localize('lessThanXMinutes', 1, localizeOptions)
      } else {
        return localize('xMinutes', minutes, localizeOptions)
      }
    }

  // 2 mins up to 0.75 hrs
  } else if (minutes < 45) {
    return localize('xMinutes', minutes, localizeOptions)

  // 0.75 hrs up to 1.5 hrs
  } else if (minutes < 90) {
    return localize('aboutXHours', 1, localizeOptions)

  // 1.5 hrs up to 24 hrs
  } else if (minutes < MINUTES_IN_DAY) {
    var hours = Math.round(minutes / 60)
    return localize('aboutXHours', hours, localizeOptions)

  // 1 day up to 1.75 days
  } else if (minutes < MINUTES_IN_ALMOST_TWO_DAYS) {
    return localize('xDays', 1, localizeOptions)

  // 1.75 days up to 30 days
  } else if (minutes < MINUTES_IN_MONTH) {
    var days = Math.round(minutes / MINUTES_IN_DAY)
    return localize('xDays', days, localizeOptions)

  // 1 month up to 2 months
  } else if (minutes < MINUTES_IN_TWO_MONTHS) {
    months = Math.round(minutes / MINUTES_IN_MONTH)
    return localize('aboutXMonths', months, localizeOptions)
  }

  months = differenceInMonths(dateRight, dateLeft)

  // 2 months up to 12 months
  if (months < 12) {
    var nearestMonth = Math.round(minutes / MINUTES_IN_MONTH)
    return localize('xMonths', nearestMonth, localizeOptions)

  // 1 year up to max Date
  } else {
    var monthsSinceStartOfYear = months % 12
    var years = Math.floor(months / 12)

    // N years up to 1 years 3 months
    if (monthsSinceStartOfYear < 3) {
      return localize('aboutXYears', years, localizeOptions)

    // N years 3 months up to N years 9 months
    } else if (monthsSinceStartOfYear < 9) {
      return localize('overXYears', years, localizeOptions)

    // N years 9 months up to N year 12 months
    } else {
      return localize('almostXYears', years + 1, localizeOptions)
    }
  }
}

module.exports = distanceInWords

},{"../compare_desc/index.js":38,"../difference_in_months/index.js":51,"../difference_in_seconds/index.js":53,"../locale/en/index.js":143,"../parse/index.js":146}],57:[function(require,module,exports){
var compareDesc = require('../compare_desc/index.js')
var parse = require('../parse/index.js')
var differenceInSeconds = require('../difference_in_seconds/index.js')
var enLocale = require('../locale/en/index.js')

var MINUTES_IN_DAY = 1440
var MINUTES_IN_MONTH = 43200
var MINUTES_IN_YEAR = 525600

/**
 * @category Common Helpers
 * @summary Return the distance between the given dates in words.
 *
 * @description
 * Return the distance between the given dates in words, using strict units.
 * This is like `distanceInWords`, but does not use helpers like 'almost', 'over',
 * 'less than' and the like.
 *
 * | Distance between dates | Result              |
 * |------------------------|---------------------|
 * | 0 ... 59 secs          | [0..59] seconds     |
 * | 1 ... 59 mins          | [1..59] minutes     |
 * | 1 ... 23 hrs           | [1..23] hours       |
 * | 1 ... 29 days          | [1..29] days        |
 * | 1 ... 11 months        | [1..11] months      |
 * | 1 ... N years          | [1..N]  years       |
 *
 * @param {Date|String|Number} dateToCompare - the date to compare with
 * @param {Date|String|Number} date - the other date
 * @param {Object} [options] - the object with options
 * @param {Boolean} [options.addSuffix=false] - result indicates if the second date is earlier or later than the first
 * @param {'s'|'m'|'h'|'d'|'M'|'Y'} [options.unit] - if specified, will force a unit
 * @param {'floor'|'ceil'|'round'} [options.partialMethod='floor'] - which way to round partial units
 * @param {Object} [options.locale=enLocale] - the locale object
 * @returns {String} the distance in words
 *
 * @example
 * // What is the distance between 2 July 2014 and 1 January 2015?
 * var result = distanceInWordsStrict(
 *   new Date(2014, 6, 2),
 *   new Date(2015, 0, 2)
 * )
 * //=> '6 months'
 *
 * @example
 * // What is the distance between 1 January 2015 00:00:15
 * // and 1 January 2015 00:00:00?
 * var result = distanceInWordsStrict(
 *   new Date(2015, 0, 1, 0, 0, 15),
 *   new Date(2015, 0, 1, 0, 0, 0),
 * )
 * //=> '15 seconds'
 *
 * @example
 * // What is the distance from 1 January 2016
 * // to 1 January 2015, with a suffix?
 * var result = distanceInWordsStrict(
 *   new Date(2016, 0, 1),
 *   new Date(2015, 0, 1),
 *   {addSuffix: true}
 * )
 * //=> '1 year ago'
 *
 * @example
 * // What is the distance from 1 January 2016
 * // to 1 January 2015, in minutes?
 * var result = distanceInWordsStrict(
 *   new Date(2016, 0, 1),
 *   new Date(2015, 0, 1),
 *   {unit: 'm'}
 * )
 * //=> '525600 minutes'
 *
 * @example
 * // What is the distance from 1 January 2016
 * // to 28 January 2015, in months, rounded up?
 * var result = distanceInWordsStrict(
 *   new Date(2015, 0, 28),
 *   new Date(2015, 0, 1),
 *   {unit: 'M', partialMethod: 'ceil'}
 * )
 * //=> '1 month'
 *
 * @example
 * // What is the distance between 1 August 2016 and 1 January 2015 in Esperanto?
 * var eoLocale = require('date-fns/locale/eo')
 * var result = distanceInWordsStrict(
 *   new Date(2016, 7, 1),
 *   new Date(2015, 0, 1),
 *   {locale: eoLocale}
 * )
 * //=> '1 jaro'
 */
function distanceInWordsStrict (dirtyDateToCompare, dirtyDate, dirtyOptions) {
  var options = dirtyOptions || {}

  var comparison = compareDesc(dirtyDateToCompare, dirtyDate)

  var locale = options.locale
  var localize = enLocale.distanceInWords.localize
  if (locale && locale.distanceInWords && locale.distanceInWords.localize) {
    localize = locale.distanceInWords.localize
  }

  var localizeOptions = {
    addSuffix: Boolean(options.addSuffix),
    comparison: comparison
  }

  var dateLeft, dateRight
  if (comparison > 0) {
    dateLeft = parse(dirtyDateToCompare)
    dateRight = parse(dirtyDate)
  } else {
    dateLeft = parse(dirtyDate)
    dateRight = parse(dirtyDateToCompare)
  }

  var unit
  var mathPartial = Math[options.partialMethod ? String(options.partialMethod) : 'floor']
  var seconds = differenceInSeconds(dateRight, dateLeft)
  var offset = dateRight.getTimezoneOffset() - dateLeft.getTimezoneOffset()
  var minutes = mathPartial(seconds / 60) - offset
  var hours, days, months, years

  if (options.unit) {
    unit = String(options.unit)
  } else {
    if (minutes < 1) {
      unit = 's'
    } else if (minutes < 60) {
      unit = 'm'
    } else if (minutes < MINUTES_IN_DAY) {
      unit = 'h'
    } else if (minutes < MINUTES_IN_MONTH) {
      unit = 'd'
    } else if (minutes < MINUTES_IN_YEAR) {
      unit = 'M'
    } else {
      unit = 'Y'
    }
  }

  // 0 up to 60 seconds
  if (unit === 's') {
    return localize('xSeconds', seconds, localizeOptions)

  // 1 up to 60 mins
  } else if (unit === 'm') {
    return localize('xMinutes', minutes, localizeOptions)

  // 1 up to 24 hours
  } else if (unit === 'h') {
    hours = mathPartial(minutes / 60)
    return localize('xHours', hours, localizeOptions)

  // 1 up to 30 days
  } else if (unit === 'd') {
    days = mathPartial(minutes / MINUTES_IN_DAY)
    return localize('xDays', days, localizeOptions)

  // 1 up to 12 months
  } else if (unit === 'M') {
    months = mathPartial(minutes / MINUTES_IN_MONTH)
    return localize('xMonths', months, localizeOptions)

  // 1 year up to max Date
  } else if (unit === 'Y') {
    years = mathPartial(minutes / MINUTES_IN_YEAR)
    return localize('xYears', years, localizeOptions)
  }

  throw new Error('Unknown unit: ' + unit)
}

module.exports = distanceInWordsStrict

},{"../compare_desc/index.js":38,"../difference_in_seconds/index.js":53,"../locale/en/index.js":143,"../parse/index.js":146}],58:[function(require,module,exports){
var distanceInWords = require('../distance_in_words/index.js')

/**
 * @category Common Helpers
 * @summary Return the distance between the given date and now in words.
 *
 * @description
 * Return the distance between the given date and now in words.
 *
 * | Distance to now                                                   | Result              |
 * |-------------------------------------------------------------------|---------------------|
 * | 0 ... 30 secs                                                     | less than a minute  |
 * | 30 secs ... 1 min 30 secs                                         | 1 minute            |
 * | 1 min 30 secs ... 44 mins 30 secs                                 | [2..44] minutes     |
 * | 44 mins ... 30 secs ... 89 mins 30 secs                           | about 1 hour        |
 * | 89 mins 30 secs ... 23 hrs 59 mins 30 secs                        | about [2..24] hours |
 * | 23 hrs 59 mins 30 secs ... 41 hrs 59 mins 30 secs                 | 1 day               |
 * | 41 hrs 59 mins 30 secs ... 29 days 23 hrs 59 mins 30 secs         | [2..30] days        |
 * | 29 days 23 hrs 59 mins 30 secs ... 44 days 23 hrs 59 mins 30 secs | about 1 month       |
 * | 44 days 23 hrs 59 mins 30 secs ... 59 days 23 hrs 59 mins 30 secs | about 2 months      |
 * | 59 days 23 hrs 59 mins 30 secs ... 1 yr                           | [2..12] months      |
 * | 1 yr ... 1 yr 3 months                                            | about 1 year        |
 * | 1 yr 3 months ... 1 yr 9 month s                                  | over 1 year         |
 * | 1 yr 9 months ... 2 yrs                                           | almost 2 years      |
 * | N yrs ... N yrs 3 months                                          | about N years       |
 * | N yrs 3 months ... N yrs 9 months                                 | over N years        |
 * | N yrs 9 months ... N+1 yrs                                        | almost N+1 years    |
 *
 * With `options.includeSeconds == true`:
 * | Distance to now     | Result               |
 * |---------------------|----------------------|
 * | 0 secs ... 5 secs   | less than 5 seconds  |
 * | 5 secs ... 10 secs  | less than 10 seconds |
 * | 10 secs ... 20 secs | less than 20 seconds |
 * | 20 secs ... 40 secs | half a minute        |
 * | 40 secs ... 60 secs | less than a minute   |
 * | 60 secs ... 90 secs | 1 minute             |
 *
 * @param {Date|String|Number} date - the given date
 * @param {Object} [options] - the object with options
 * @param {Boolean} [options.includeSeconds=false] - distances less than a minute are more detailed
 * @param {Boolean} [options.addSuffix=false] - result specifies if the second date is earlier or later than the first
 * @param {Object} [options.locale=enLocale] - the locale object
 * @returns {String} the distance in words
 *
 * @example
 * // If today is 1 January 2015, what is the distance to 2 July 2014?
 * var result = distanceInWordsToNow(
 *   new Date(2014, 6, 2)
 * )
 * //=> '6 months'
 *
 * @example
 * // If now is 1 January 2015 00:00:00,
 * // what is the distance to 1 January 2015 00:00:15, including seconds?
 * var result = distanceInWordsToNow(
 *   new Date(2015, 0, 1, 0, 0, 15),
 *   {includeSeconds: true}
 * )
 * //=> 'less than 20 seconds'
 *
 * @example
 * // If today is 1 January 2015,
 * // what is the distance to 1 January 2016, with a suffix?
 * var result = distanceInWordsToNow(
 *   new Date(2016, 0, 1),
 *   {addSuffix: true}
 * )
 * //=> 'in about 1 year'
 *
 * @example
 * // If today is 1 January 2015,
 * // what is the distance to 1 August 2016 in Esperanto?
 * var eoLocale = require('date-fns/locale/eo')
 * var result = distanceInWordsToNow(
 *   new Date(2016, 7, 1),
 *   {locale: eoLocale}
 * )
 * //=> 'pli ol 1 jaro'
 */
function distanceInWordsToNow (dirtyDate, dirtyOptions) {
  return distanceInWords(Date.now(), dirtyDate, dirtyOptions)
}

module.exports = distanceInWordsToNow

},{"../distance_in_words/index.js":56}],59:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Day Helpers
 * @summary Return the array of dates within the specified range.
 *
 * @description
 * Return the array of dates within the specified range.
 *
 * @param {Date|String|Number} startDate - the first date
 * @param {Date|String|Number} endDate - the last date
 * @param {Number} [step=1] - the step between each day
 * @returns {Date[]} the array with starts of days from the day of startDate to the day of endDate
 * @throws {Error} startDate cannot be after endDate
 *
 * @example
 * // Each day between 6 October 2014 and 10 October 2014:
 * var result = eachDay(
 *   new Date(2014, 9, 6),
 *   new Date(2014, 9, 10)
 * )
 * //=> [
 * //   Mon Oct 06 2014 00:00:00,
 * //   Tue Oct 07 2014 00:00:00,
 * //   Wed Oct 08 2014 00:00:00,
 * //   Thu Oct 09 2014 00:00:00,
 * //   Fri Oct 10 2014 00:00:00
 * // ]
 */
function eachDay (dirtyStartDate, dirtyEndDate, dirtyStep) {
  var startDate = parse(dirtyStartDate)
  var endDate = parse(dirtyEndDate)
  var step = dirtyStep !== undefined ? dirtyStep : 1

  var endTime = endDate.getTime()

  if (startDate.getTime() > endTime) {
    throw new Error('The first date cannot be after the second date')
  }

  var dates = []

  var currentDate = startDate
  currentDate.setHours(0, 0, 0, 0)

  while (currentDate.getTime() <= endTime) {
    dates.push(parse(currentDate))
    currentDate.setDate(currentDate.getDate() + step)
  }

  return dates
}

module.exports = eachDay

},{"../parse/index.js":146}],60:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Day Helpers
 * @summary Return the end of a day for the given date.
 *
 * @description
 * Return the end of a day for the given date.
 * The result will be in the local timezone.
 *
 * @param {Date|String|Number} date - the original date
 * @returns {Date} the end of a day
 *
 * @example
 * // The end of a day for 2 September 2014 11:55:00:
 * var result = endOfDay(new Date(2014, 8, 2, 11, 55, 0))
 * //=> Tue Sep 02 2014 23:59:59.999
 */
function endOfDay (dirtyDate) {
  var date = parse(dirtyDate)
  date.setHours(23, 59, 59, 999)
  return date
}

module.exports = endOfDay

},{"../parse/index.js":146}],61:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Hour Helpers
 * @summary Return the end of an hour for the given date.
 *
 * @description
 * Return the end of an hour for the given date.
 * The result will be in the local timezone.
 *
 * @param {Date|String|Number} date - the original date
 * @returns {Date} the end of an hour
 *
 * @example
 * // The end of an hour for 2 September 2014 11:55:00:
 * var result = endOfHour(new Date(2014, 8, 2, 11, 55))
 * //=> Tue Sep 02 2014 11:59:59.999
 */
function endOfHour (dirtyDate) {
  var date = parse(dirtyDate)
  date.setMinutes(59, 59, 999)
  return date
}

module.exports = endOfHour

},{"../parse/index.js":146}],62:[function(require,module,exports){
var endOfWeek = require('../end_of_week/index.js')

/**
 * @category ISO Week Helpers
 * @summary Return the end of an ISO week for the given date.
 *
 * @description
 * Return the end of an ISO week for the given date.
 * The result will be in the local timezone.
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * @param {Date|String|Number} date - the original date
 * @returns {Date} the end of an ISO week
 *
 * @example
 * // The end of an ISO week for 2 September 2014 11:55:00:
 * var result = endOfISOWeek(new Date(2014, 8, 2, 11, 55, 0))
 * //=> Sun Sep 07 2014 23:59:59.999
 */
function endOfISOWeek (dirtyDate) {
  return endOfWeek(dirtyDate, {weekStartsOn: 1})
}

module.exports = endOfISOWeek

},{"../end_of_week/index.js":70}],63:[function(require,module,exports){
var getISOYear = require('../get_iso_year/index.js')
var startOfISOWeek = require('../start_of_iso_week/index.js')

/**
 * @category ISO Week-Numbering Year Helpers
 * @summary Return the end of an ISO week-numbering year for the given date.
 *
 * @description
 * Return the end of an ISO week-numbering year,
 * which always starts 3 days before the year's first Thursday.
 * The result will be in the local timezone.
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * @param {Date|String|Number} date - the original date
 * @returns {Date} the end of an ISO week-numbering year
 *
 * @example
 * // The end of an ISO week-numbering year for 2 July 2005:
 * var result = endOfISOYear(new Date(2005, 6, 2))
 * //=> Sun Jan 01 2006 23:59:59.999
 */
function endOfISOYear (dirtyDate) {
  var year = getISOYear(dirtyDate)
  var fourthOfJanuaryOfNextYear = new Date(0)
  fourthOfJanuaryOfNextYear.setFullYear(year + 1, 0, 4)
  fourthOfJanuaryOfNextYear.setHours(0, 0, 0, 0)
  var date = startOfISOWeek(fourthOfJanuaryOfNextYear)
  date.setMilliseconds(date.getMilliseconds() - 1)
  return date
}

module.exports = endOfISOYear

},{"../get_iso_year/index.js":83,"../start_of_iso_week/index.js":162}],64:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Minute Helpers
 * @summary Return the end of a minute for the given date.
 *
 * @description
 * Return the end of a minute for the given date.
 * The result will be in the local timezone.
 *
 * @param {Date|String|Number} date - the original date
 * @returns {Date} the end of a minute
 *
 * @example
 * // The end of a minute for 1 December 2014 22:15:45.400:
 * var result = endOfMinute(new Date(2014, 11, 1, 22, 15, 45, 400))
 * //=> Mon Dec 01 2014 22:15:59.999
 */
function endOfMinute (dirtyDate) {
  var date = parse(dirtyDate)
  date.setSeconds(59, 999)
  return date
}

module.exports = endOfMinute

},{"../parse/index.js":146}],65:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Month Helpers
 * @summary Return the end of a month for the given date.
 *
 * @description
 * Return the end of a month for the given date.
 * The result will be in the local timezone.
 *
 * @param {Date|String|Number} date - the original date
 * @returns {Date} the end of a month
 *
 * @example
 * // The end of a month for 2 September 2014 11:55:00:
 * var result = endOfMonth(new Date(2014, 8, 2, 11, 55, 0))
 * //=> Tue Sep 30 2014 23:59:59.999
 */
function endOfMonth (dirtyDate) {
  var date = parse(dirtyDate)
  var month = date.getMonth()
  date.setFullYear(date.getFullYear(), month + 1, 0)
  date.setHours(23, 59, 59, 999)
  return date
}

module.exports = endOfMonth

},{"../parse/index.js":146}],66:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Quarter Helpers
 * @summary Return the end of a year quarter for the given date.
 *
 * @description
 * Return the end of a year quarter for the given date.
 * The result will be in the local timezone.
 *
 * @param {Date|String|Number} date - the original date
 * @returns {Date} the end of a quarter
 *
 * @example
 * // The end of a quarter for 2 September 2014 11:55:00:
 * var result = endOfQuarter(new Date(2014, 8, 2, 11, 55, 0))
 * //=> Tue Sep 30 2014 23:59:59.999
 */
function endOfQuarter (dirtyDate) {
  var date = parse(dirtyDate)
  var currentMonth = date.getMonth()
  var month = currentMonth - currentMonth % 3 + 3
  date.setMonth(month, 0)
  date.setHours(23, 59, 59, 999)
  return date
}

module.exports = endOfQuarter

},{"../parse/index.js":146}],67:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Second Helpers
 * @summary Return the end of a second for the given date.
 *
 * @description
 * Return the end of a second for the given date.
 * The result will be in the local timezone.
 *
 * @param {Date|String|Number} date - the original date
 * @returns {Date} the end of a second
 *
 * @example
 * // The end of a second for 1 December 2014 22:15:45.400:
 * var result = endOfSecond(new Date(2014, 11, 1, 22, 15, 45, 400))
 * //=> Mon Dec 01 2014 22:15:45.999
 */
function endOfSecond (dirtyDate) {
  var date = parse(dirtyDate)
  date.setMilliseconds(999)
  return date
}

module.exports = endOfSecond

},{"../parse/index.js":146}],68:[function(require,module,exports){
var endOfDay = require('../end_of_day/index.js')

/**
 * @category Day Helpers
 * @summary Return the end of today.
 *
 * @description
 * Return the end of today.
 *
 * @returns {Date} the end of today
 *
 * @example
 * // If today is 6 October 2014:
 * var result = endOfToday()
 * //=> Mon Oct 6 2014 23:59:59.999
 */
function endOfToday () {
  return endOfDay(new Date())
}

module.exports = endOfToday

},{"../end_of_day/index.js":60}],69:[function(require,module,exports){
/**
 * @category Day Helpers
 * @summary Return the end of tomorrow.
 *
 * @description
 * Return the end of tomorrow.
 *
 * @returns {Date} the end of tomorrow
 *
 * @example
 * // If today is 6 October 2014:
 * var result = endOfTomorrow()
 * //=> Tue Oct 7 2014 23:59:59.999
 */
function endOfTomorrow () {
  var now = new Date()
  var year = now.getFullYear()
  var month = now.getMonth()
  var day = now.getDate()

  var date = new Date(0)
  date.setFullYear(year, month, day + 1)
  date.setHours(23, 59, 59, 999)
  return date
}

module.exports = endOfTomorrow

},{}],70:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Week Helpers
 * @summary Return the end of a week for the given date.
 *
 * @description
 * Return the end of a week for the given date.
 * The result will be in the local timezone.
 *
 * @param {Date|String|Number} date - the original date
 * @param {Object} [options] - the object with options
 * @param {Number} [options.weekStartsOn=0] - the index of the first day of the week (0 - Sunday)
 * @returns {Date} the end of a week
 *
 * @example
 * // The end of a week for 2 September 2014 11:55:00:
 * var result = endOfWeek(new Date(2014, 8, 2, 11, 55, 0))
 * //=> Sat Sep 06 2014 23:59:59.999
 *
 * @example
 * // If the week starts on Monday, the end of the week for 2 September 2014 11:55:00:
 * var result = endOfWeek(new Date(2014, 8, 2, 11, 55, 0), {weekStartsOn: 1})
 * //=> Sun Sep 07 2014 23:59:59.999
 */
function endOfWeek (dirtyDate, dirtyOptions) {
  var weekStartsOn = dirtyOptions ? (Number(dirtyOptions.weekStartsOn) || 0) : 0

  var date = parse(dirtyDate)
  var day = date.getDay()
  var diff = (day < weekStartsOn ? -7 : 0) + 6 - (day - weekStartsOn)

  date.setDate(date.getDate() + diff)
  date.setHours(23, 59, 59, 999)
  return date
}

module.exports = endOfWeek

},{"../parse/index.js":146}],71:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Year Helpers
 * @summary Return the end of a year for the given date.
 *
 * @description
 * Return the end of a year for the given date.
 * The result will be in the local timezone.
 *
 * @param {Date|String|Number} date - the original date
 * @returns {Date} the end of a year
 *
 * @example
 * // The end of a year for 2 September 2014 11:55:00:
 * var result = endOfYear(new Date(2014, 8, 2, 11, 55, 00))
 * //=> Wed Dec 31 2014 23:59:59.999
 */
function endOfYear (dirtyDate) {
  var date = parse(dirtyDate)
  var year = date.getFullYear()
  date.setFullYear(year + 1, 0, 0)
  date.setHours(23, 59, 59, 999)
  return date
}

module.exports = endOfYear

},{"../parse/index.js":146}],72:[function(require,module,exports){
/**
 * @category Day Helpers
 * @summary Return the end of yesterday.
 *
 * @description
 * Return the end of yesterday.
 *
 * @returns {Date} the end of yesterday
 *
 * @example
 * // If today is 6 October 2014:
 * var result = endOfYesterday()
 * //=> Sun Oct 5 2014 23:59:59.999
 */
function endOfYesterday () {
  var now = new Date()
  var year = now.getFullYear()
  var month = now.getMonth()
  var day = now.getDate()

  var date = new Date(0)
  date.setFullYear(year, month, day - 1)
  date.setHours(23, 59, 59, 999)
  return date
}

module.exports = endOfYesterday

},{}],73:[function(require,module,exports){
var getDayOfYear = require('../get_day_of_year/index.js')
var getISOWeek = require('../get_iso_week/index.js')
var getISOYear = require('../get_iso_year/index.js')
var parse = require('../parse/index.js')
var isValid = require('../is_valid/index.js')
var enLocale = require('../locale/en/index.js')

/**
 * @category Common Helpers
 * @summary Format the date.
 *
 * @description
 * Return the formatted date string in the given format.
 *
 * Accepted tokens:
 * | Unit                    | Token | Result examples                  |
 * |-------------------------|-------|----------------------------------|
 * | Month                   | M     | 1, 2, ..., 12                    |
 * |                         | Mo    | 1st, 2nd, ..., 12th              |
 * |                         | MM    | 01, 02, ..., 12                  |
 * |                         | MMM   | Jan, Feb, ..., Dec               |
 * |                         | MMMM  | January, February, ..., December |
 * | Quarter                 | Q     | 1, 2, 3, 4                       |
 * |                         | Qo    | 1st, 2nd, 3rd, 4th               |
 * | Day of month            | D     | 1, 2, ..., 31                    |
 * |                         | Do    | 1st, 2nd, ..., 31st              |
 * |                         | DD    | 01, 02, ..., 31                  |
 * | Day of year             | DDD   | 1, 2, ..., 366                   |
 * |                         | DDDo  | 1st, 2nd, ..., 366th             |
 * |                         | DDDD  | 001, 002, ..., 366               |
 * | Day of week             | d     | 0, 1, ..., 6                     |
 * |                         | do    | 0th, 1st, ..., 6th               |
 * |                         | dd    | Su, Mo, ..., Sa                  |
 * |                         | ddd   | Sun, Mon, ..., Sat               |
 * |                         | dddd  | Sunday, Monday, ..., Saturday    |
 * | Day of ISO week         | E     | 1, 2, ..., 7                     |
 * | ISO week                | W     | 1, 2, ..., 53                    |
 * |                         | Wo    | 1st, 2nd, ..., 53rd              |
 * |                         | WW    | 01, 02, ..., 53                  |
 * | Year                    | YY    | 00, 01, ..., 99                  |
 * |                         | YYYY  | 1900, 1901, ..., 2099            |
 * | ISO week-numbering year | GG    | 00, 01, ..., 99                  |
 * |                         | GGGG  | 1900, 1901, ..., 2099            |
 * | AM/PM                   | A     | AM, PM                           |
 * |                         | a     | am, pm                           |
 * |                         | aa    | a.m., p.m.                       |
 * | Hour                    | H     | 0, 1, ... 23                     |
 * |                         | HH    | 00, 01, ... 23                   |
 * |                         | h     | 1, 2, ..., 12                    |
 * |                         | hh    | 01, 02, ..., 12                  |
 * | Minute                  | m     | 0, 1, ..., 59                    |
 * |                         | mm    | 00, 01, ..., 59                  |
 * | Second                  | s     | 0, 1, ..., 59                    |
 * |                         | ss    | 00, 01, ..., 59                  |
 * | 1/10 of second          | S     | 0, 1, ..., 9                     |
 * | 1/100 of second         | SS    | 00, 01, ..., 99                  |
 * | Millisecond             | SSS   | 000, 001, ..., 999               |
 * | Timezone                | Z     | -01:00, +00:00, ... +12:00       |
 * |                         | ZZ    | -0100, +0000, ..., +1200         |
 * | Seconds timestamp       | X     | 512969520                        |
 * | Milliseconds timestamp  | x     | 512969520900                     |
 *
 * The characters wrapped in square brackets are escaped.
 *
 * The result may vary by locale.
 *
 * @param {Date|String|Number} date - the original date
 * @param {String} [format='YYYY-MM-DDTHH:mm:ss.SSSZ'] - the string of tokens
 * @param {Object} [options] - the object with options
 * @param {Object} [options.locale=enLocale] - the locale object
 * @returns {String} the formatted date string
 *
 * @example
 * // Represent 11 February 2014 in middle-endian format:
 * var result = format(
 *   new Date(2014, 1, 11),
 *   'MM/DD/YYYY'
 * )
 * //=> '02/11/2014'
 *
 * @example
 * // Represent 2 July 2014 in Esperanto:
 * var eoLocale = require('date-fns/locale/eo')
 * var result = format(
 *   new Date(2014, 6, 2),
 *   'Do [de] MMMM YYYY',
 *   {locale: eoLocale}
 * )
 * //=> '2-a de julio 2014'
 */
function format (dirtyDate, dirtyFormatStr, dirtyOptions) {
  var formatStr = dirtyFormatStr ? String(dirtyFormatStr) : 'YYYY-MM-DDTHH:mm:ss.SSSZ'
  var options = dirtyOptions || {}

  var locale = options.locale
  var localeFormatters = enLocale.format.formatters
  var formattingTokensRegExp = enLocale.format.formattingTokensRegExp
  if (locale && locale.format && locale.format.formatters) {
    localeFormatters = locale.format.formatters

    if (locale.format.formattingTokensRegExp) {
      formattingTokensRegExp = locale.format.formattingTokensRegExp
    }
  }

  var date = parse(dirtyDate)

  if (!isValid(date)) {
    return 'Invalid Date'
  }

  var formatFn = buildFormatFn(formatStr, localeFormatters, formattingTokensRegExp)

  return formatFn(date)
}

var formatters = {
  // Month: 1, 2, ..., 12
  'M': function (date) {
    return date.getMonth() + 1
  },

  // Month: 01, 02, ..., 12
  'MM': function (date) {
    return addLeadingZeros(date.getMonth() + 1, 2)
  },

  // Quarter: 1, 2, 3, 4
  'Q': function (date) {
    return Math.ceil((date.getMonth() + 1) / 3)
  },

  // Day of month: 1, 2, ..., 31
  'D': function (date) {
    return date.getDate()
  },

  // Day of month: 01, 02, ..., 31
  'DD': function (date) {
    return addLeadingZeros(date.getDate(), 2)
  },

  // Day of year: 1, 2, ..., 366
  'DDD': function (date) {
    return getDayOfYear(date)
  },

  // Day of year: 001, 002, ..., 366
  'DDDD': function (date) {
    return addLeadingZeros(getDayOfYear(date), 3)
  },

  // Day of week: 0, 1, ..., 6
  'd': function (date) {
    return date.getDay()
  },

  // Day of ISO week: 1, 2, ..., 7
  'E': function (date) {
    return date.getDay() || 7
  },

  // ISO week: 1, 2, ..., 53
  'W': function (date) {
    return getISOWeek(date)
  },

  // ISO week: 01, 02, ..., 53
  'WW': function (date) {
    return addLeadingZeros(getISOWeek(date), 2)
  },

  // Year: 00, 01, ..., 99
  'YY': function (date) {
    return addLeadingZeros(date.getFullYear(), 4).substr(2)
  },

  // Year: 1900, 1901, ..., 2099
  'YYYY': function (date) {
    return addLeadingZeros(date.getFullYear(), 4)
  },

  // ISO week-numbering year: 00, 01, ..., 99
  'GG': function (date) {
    return String(getISOYear(date)).substr(2)
  },

  // ISO week-numbering year: 1900, 1901, ..., 2099
  'GGGG': function (date) {
    return getISOYear(date)
  },

  // Hour: 0, 1, ... 23
  'H': function (date) {
    return date.getHours()
  },

  // Hour: 00, 01, ..., 23
  'HH': function (date) {
    return addLeadingZeros(date.getHours(), 2)
  },

  // Hour: 1, 2, ..., 12
  'h': function (date) {
    var hours = date.getHours()
    if (hours === 0) {
      return 12
    } else if (hours > 12) {
      return hours % 12
    } else {
      return hours
    }
  },

  // Hour: 01, 02, ..., 12
  'hh': function (date) {
    return addLeadingZeros(formatters['h'](date), 2)
  },

  // Minute: 0, 1, ..., 59
  'm': function (date) {
    return date.getMinutes()
  },

  // Minute: 00, 01, ..., 59
  'mm': function (date) {
    return addLeadingZeros(date.getMinutes(), 2)
  },

  // Second: 0, 1, ..., 59
  's': function (date) {
    return date.getSeconds()
  },

  // Second: 00, 01, ..., 59
  'ss': function (date) {
    return addLeadingZeros(date.getSeconds(), 2)
  },

  // 1/10 of second: 0, 1, ..., 9
  'S': function (date) {
    return Math.floor(date.getMilliseconds() / 100)
  },

  // 1/100 of second: 00, 01, ..., 99
  'SS': function (date) {
    return addLeadingZeros(Math.floor(date.getMilliseconds() / 10), 2)
  },

  // Millisecond: 000, 001, ..., 999
  'SSS': function (date) {
    return addLeadingZeros(date.getMilliseconds(), 3)
  },

  // Timezone: -01:00, +00:00, ... +12:00
  'Z': function (date) {
    return formatTimezone(date.getTimezoneOffset(), ':')
  },

  // Timezone: -0100, +0000, ... +1200
  'ZZ': function (date) {
    return formatTimezone(date.getTimezoneOffset())
  },

  // Seconds timestamp: 512969520
  'X': function (date) {
    return Math.floor(date.getTime() / 1000)
  },

  // Milliseconds timestamp: 512969520900
  'x': function (date) {
    return date.getTime()
  }
}

function buildFormatFn (formatStr, localeFormatters, formattingTokensRegExp) {
  var array = formatStr.match(formattingTokensRegExp)
  var length = array.length

  var i
  var formatter
  for (i = 0; i < length; i++) {
    formatter = localeFormatters[array[i]] || formatters[array[i]]
    if (formatter) {
      array[i] = formatter
    } else {
      array[i] = removeFormattingTokens(array[i])
    }
  }

  return function (date) {
    var output = ''
    for (var i = 0; i < length; i++) {
      if (array[i] instanceof Function) {
        output += array[i](date, formatters)
      } else {
        output += array[i]
      }
    }
    return output
  }
}

function removeFormattingTokens (input) {
  if (input.match(/\[[\s\S]/)) {
    return input.replace(/^\[|]$/g, '')
  }
  return input.replace(/\\/g, '')
}

function formatTimezone (offset, delimeter) {
  delimeter = delimeter || ''
  var sign = offset > 0 ? '-' : '+'
  var absOffset = Math.abs(offset)
  var hours = Math.floor(absOffset / 60)
  var minutes = absOffset % 60
  return sign + addLeadingZeros(hours, 2) + delimeter + addLeadingZeros(minutes, 2)
}

function addLeadingZeros (number, targetLength) {
  var output = Math.abs(number).toString()
  while (output.length < targetLength) {
    output = '0' + output
  }
  return output
}

module.exports = format

},{"../get_day_of_year/index.js":76,"../get_iso_week/index.js":81,"../get_iso_year/index.js":83,"../is_valid/index.js":129,"../locale/en/index.js":143,"../parse/index.js":146}],74:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Day Helpers
 * @summary Get the day of the month of the given date.
 *
 * @description
 * Get the day of the month of the given date.
 *
 * @param {Date|String|Number} date - the given date
 * @returns {Number} the day of month
 *
 * @example
 * // Which day of the month is 29 February 2012?
 * var result = getDate(new Date(2012, 1, 29))
 * //=> 29
 */
function getDate (dirtyDate) {
  var date = parse(dirtyDate)
  var dayOfMonth = date.getDate()
  return dayOfMonth
}

module.exports = getDate

},{"../parse/index.js":146}],75:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Weekday Helpers
 * @summary Get the day of the week of the given date.
 *
 * @description
 * Get the day of the week of the given date.
 *
 * @param {Date|String|Number} date - the given date
 * @returns {Number} the day of week
 *
 * @example
 * // Which day of the week is 29 February 2012?
 * var result = getDay(new Date(2012, 1, 29))
 * //=> 3
 */
function getDay (dirtyDate) {
  var date = parse(dirtyDate)
  var day = date.getDay()
  return day
}

module.exports = getDay

},{"../parse/index.js":146}],76:[function(require,module,exports){
var parse = require('../parse/index.js')
var startOfYear = require('../start_of_year/index.js')
var differenceInCalendarDays = require('../difference_in_calendar_days/index.js')

/**
 * @category Day Helpers
 * @summary Get the day of the year of the given date.
 *
 * @description
 * Get the day of the year of the given date.
 *
 * @param {Date|String|Number} date - the given date
 * @returns {Number} the day of year
 *
 * @example
 * // Which day of the year is 2 July 2014?
 * var result = getDayOfYear(new Date(2014, 6, 2))
 * //=> 183
 */
function getDayOfYear (dirtyDate) {
  var date = parse(dirtyDate)
  var diff = differenceInCalendarDays(date, startOfYear(date))
  var dayOfYear = diff + 1
  return dayOfYear
}

module.exports = getDayOfYear

},{"../difference_in_calendar_days/index.js":39,"../parse/index.js":146,"../start_of_year/index.js":171}],77:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Month Helpers
 * @summary Get the number of days in a month of the given date.
 *
 * @description
 * Get the number of days in a month of the given date.
 *
 * @param {Date|String|Number} date - the given date
 * @returns {Number} the number of days in a month
 *
 * @example
 * // How many days are in February 2000?
 * var result = getDaysInMonth(new Date(2000, 1))
 * //=> 29
 */
function getDaysInMonth (dirtyDate) {
  var date = parse(dirtyDate)
  var year = date.getFullYear()
  var monthIndex = date.getMonth()
  var lastDayOfMonth = new Date(0)
  lastDayOfMonth.setFullYear(year, monthIndex + 1, 0)
  lastDayOfMonth.setHours(0, 0, 0, 0)
  return lastDayOfMonth.getDate()
}

module.exports = getDaysInMonth

},{"../parse/index.js":146}],78:[function(require,module,exports){
var isLeapYear = require('../is_leap_year/index.js')

/**
 * @category Year Helpers
 * @summary Get the number of days in a year of the given date.
 *
 * @description
 * Get the number of days in a year of the given date.
 *
 * @param {Date|String|Number} date - the given date
 * @returns {Number} the number of days in a year
 *
 * @example
 * // How many days are in 2012?
 * var result = getDaysInYear(new Date(2012, 0, 1))
 * //=> 366
 */
function getDaysInYear (dirtyDate) {
  return isLeapYear(dirtyDate) ? 366 : 365
}

module.exports = getDaysInYear

},{"../is_leap_year/index.js":101}],79:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Hour Helpers
 * @summary Get the hours of the given date.
 *
 * @description
 * Get the hours of the given date.
 *
 * @param {Date|String|Number} date - the given date
 * @returns {Number} the hours
 *
 * @example
 * // Get the hours of 29 February 2012 11:45:00:
 * var result = getHours(new Date(2012, 1, 29, 11, 45))
 * //=> 11
 */
function getHours (dirtyDate) {
  var date = parse(dirtyDate)
  var hours = date.getHours()
  return hours
}

module.exports = getHours

},{"../parse/index.js":146}],80:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Weekday Helpers
 * @summary Get the day of the ISO week of the given date.
 *
 * @description
 * Get the day of the ISO week of the given date,
 * which is 7 for Sunday, 1 for Monday etc.
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * @param {Date|String|Number} date - the given date
 * @returns {Number} the day of ISO week
 *
 * @example
 * // Which day of the ISO week is 26 February 2012?
 * var result = getISODay(new Date(2012, 1, 26))
 * //=> 7
 */
function getISODay (dirtyDate) {
  var date = parse(dirtyDate)
  var day = date.getDay()

  if (day === 0) {
    day = 7
  }

  return day
}

module.exports = getISODay

},{"../parse/index.js":146}],81:[function(require,module,exports){
var parse = require('../parse/index.js')
var startOfISOWeek = require('../start_of_iso_week/index.js')
var startOfISOYear = require('../start_of_iso_year/index.js')

var MILLISECONDS_IN_WEEK = 604800000

/**
 * @category ISO Week Helpers
 * @summary Get the ISO week of the given date.
 *
 * @description
 * Get the ISO week of the given date.
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * @param {Date|String|Number} date - the given date
 * @returns {Number} the ISO week
 *
 * @example
 * // Which week of the ISO-week numbering year is 2 January 2005?
 * var result = getISOWeek(new Date(2005, 0, 2))
 * //=> 53
 */
function getISOWeek (dirtyDate) {
  var date = parse(dirtyDate)
  var diff = startOfISOWeek(date).getTime() - startOfISOYear(date).getTime()

  // Round the number of days to the nearest integer
  // because the number of milliseconds in a week is not constant
  // (e.g. it's different in the week of the daylight saving time clock shift)
  return Math.round(diff / MILLISECONDS_IN_WEEK) + 1
}

module.exports = getISOWeek

},{"../parse/index.js":146,"../start_of_iso_week/index.js":162,"../start_of_iso_year/index.js":163}],82:[function(require,module,exports){
var startOfISOYear = require('../start_of_iso_year/index.js')
var addWeeks = require('../add_weeks/index.js')

var MILLISECONDS_IN_WEEK = 604800000

/**
 * @category ISO Week-Numbering Year Helpers
 * @summary Get the number of weeks in an ISO week-numbering year of the given date.
 *
 * @description
 * Get the number of weeks in an ISO week-numbering year of the given date.
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * @param {Date|String|Number} date - the given date
 * @returns {Number} the number of ISO weeks in a year
 *
 * @example
 * // How many weeks are in ISO week-numbering year 2015?
 * var result = getISOWeeksInYear(new Date(2015, 1, 11))
 * //=> 53
 */
function getISOWeeksInYear (dirtyDate) {
  var thisYear = startOfISOYear(dirtyDate)
  var nextYear = startOfISOYear(addWeeks(thisYear, 60))
  var diff = nextYear.valueOf() - thisYear.valueOf()
  // Round the number of weeks to the nearest integer
  // because the number of milliseconds in a week is not constant
  // (e.g. it's different in the week of the daylight saving time clock shift)
  return Math.round(diff / MILLISECONDS_IN_WEEK)
}

module.exports = getISOWeeksInYear

},{"../add_weeks/index.js":32,"../start_of_iso_year/index.js":163}],83:[function(require,module,exports){
var parse = require('../parse/index.js')
var startOfISOWeek = require('../start_of_iso_week/index.js')

/**
 * @category ISO Week-Numbering Year Helpers
 * @summary Get the ISO week-numbering year of the given date.
 *
 * @description
 * Get the ISO week-numbering year of the given date,
 * which always starts 3 days before the year's first Thursday.
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * @param {Date|String|Number} date - the given date
 * @returns {Number} the ISO week-numbering year
 *
 * @example
 * // Which ISO-week numbering year is 2 January 2005?
 * var result = getISOYear(new Date(2005, 0, 2))
 * //=> 2004
 */
function getISOYear (dirtyDate) {
  var date = parse(dirtyDate)
  var year = date.getFullYear()

  var fourthOfJanuaryOfNextYear = new Date(0)
  fourthOfJanuaryOfNextYear.setFullYear(year + 1, 0, 4)
  fourthOfJanuaryOfNextYear.setHours(0, 0, 0, 0)
  var startOfNextYear = startOfISOWeek(fourthOfJanuaryOfNextYear)

  var fourthOfJanuaryOfThisYear = new Date(0)
  fourthOfJanuaryOfThisYear.setFullYear(year, 0, 4)
  fourthOfJanuaryOfThisYear.setHours(0, 0, 0, 0)
  var startOfThisYear = startOfISOWeek(fourthOfJanuaryOfThisYear)

  if (date.getTime() >= startOfNextYear.getTime()) {
    return year + 1
  } else if (date.getTime() >= startOfThisYear.getTime()) {
    return year
  } else {
    return year - 1
  }
}

module.exports = getISOYear

},{"../parse/index.js":146,"../start_of_iso_week/index.js":162}],84:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Millisecond Helpers
 * @summary Get the milliseconds of the given date.
 *
 * @description
 * Get the milliseconds of the given date.
 *
 * @param {Date|String|Number} date - the given date
 * @returns {Number} the milliseconds
 *
 * @example
 * // Get the milliseconds of 29 February 2012 11:45:05.123:
 * var result = getMilliseconds(new Date(2012, 1, 29, 11, 45, 5, 123))
 * //=> 123
 */
function getMilliseconds (dirtyDate) {
  var date = parse(dirtyDate)
  var milliseconds = date.getMilliseconds()
  return milliseconds
}

module.exports = getMilliseconds

},{"../parse/index.js":146}],85:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Minute Helpers
 * @summary Get the minutes of the given date.
 *
 * @description
 * Get the minutes of the given date.
 *
 * @param {Date|String|Number} date - the given date
 * @returns {Number} the minutes
 *
 * @example
 * // Get the minutes of 29 February 2012 11:45:05:
 * var result = getMinutes(new Date(2012, 1, 29, 11, 45, 5))
 * //=> 45
 */
function getMinutes (dirtyDate) {
  var date = parse(dirtyDate)
  var minutes = date.getMinutes()
  return minutes
}

module.exports = getMinutes

},{"../parse/index.js":146}],86:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Month Helpers
 * @summary Get the month of the given date.
 *
 * @description
 * Get the month of the given date.
 *
 * @param {Date|String|Number} date - the given date
 * @returns {Number} the month
 *
 * @example
 * // Which month is 29 February 2012?
 * var result = getMonth(new Date(2012, 1, 29))
 * //=> 1
 */
function getMonth (dirtyDate) {
  var date = parse(dirtyDate)
  var month = date.getMonth()
  return month
}

module.exports = getMonth

},{"../parse/index.js":146}],87:[function(require,module,exports){
var parse = require('../parse/index.js')

var MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000

/**
 * @category Range Helpers
 * @summary Get the number of days that overlap in two date ranges
 *
 * @description
 * Get the number of days that overlap in two date ranges
 *
 * @param {Date|String|Number} initialRangeStartDate - the start of the initial range
 * @param {Date|String|Number} initialRangeEndDate - the end of the initial range
 * @param {Date|String|Number} comparedRangeStartDate - the start of the range to compare it with
 * @param {Date|String|Number} comparedRangeEndDate - the end of the range to compare it with
 * @returns {Number} the number of days that overlap in two date ranges
 * @throws {Error} startDate of a date range cannot be after its endDate
 *
 * @example
 * // For overlapping date ranges adds 1 for each started overlapping day:
 * getOverlappingDaysInRanges(
 *   new Date(2014, 0, 10), new Date(2014, 0, 20), new Date(2014, 0, 17), new Date(2014, 0, 21)
 * )
 * //=> 3
 *
 * @example
 * // For non-overlapping date ranges returns 0:
 * getOverlappingDaysInRanges(
 *   new Date(2014, 0, 10), new Date(2014, 0, 20), new Date(2014, 0, 21), new Date(2014, 0, 22)
 * )
 * //=> 0
 */
function getOverlappingDaysInRanges (dirtyInitialRangeStartDate, dirtyInitialRangeEndDate, dirtyComparedRangeStartDate, dirtyComparedRangeEndDate) {
  var initialStartTime = parse(dirtyInitialRangeStartDate).getTime()
  var initialEndTime = parse(dirtyInitialRangeEndDate).getTime()
  var comparedStartTime = parse(dirtyComparedRangeStartDate).getTime()
  var comparedEndTime = parse(dirtyComparedRangeEndDate).getTime()

  if (initialStartTime > initialEndTime || comparedStartTime > comparedEndTime) {
    throw new Error('The start of the range cannot be after the end of the range')
  }

  var isOverlapping = initialStartTime < comparedEndTime && comparedStartTime < initialEndTime

  if (!isOverlapping) {
    return 0
  }

  var overlapStartDate = comparedStartTime < initialStartTime
    ? initialStartTime
    : comparedStartTime

  var overlapEndDate = comparedEndTime > initialEndTime
    ? initialEndTime
    : comparedEndTime

  var differenceInMs = overlapEndDate - overlapStartDate

  return Math.ceil(differenceInMs / MILLISECONDS_IN_DAY)
}

module.exports = getOverlappingDaysInRanges

},{"../parse/index.js":146}],88:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Quarter Helpers
 * @summary Get the year quarter of the given date.
 *
 * @description
 * Get the year quarter of the given date.
 *
 * @param {Date|String|Number} date - the given date
 * @returns {Number} the quarter
 *
 * @example
 * // Which quarter is 2 July 2014?
 * var result = getQuarter(new Date(2014, 6, 2))
 * //=> 3
 */
function getQuarter (dirtyDate) {
  var date = parse(dirtyDate)
  var quarter = Math.floor(date.getMonth() / 3) + 1
  return quarter
}

module.exports = getQuarter

},{"../parse/index.js":146}],89:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Second Helpers
 * @summary Get the seconds of the given date.
 *
 * @description
 * Get the seconds of the given date.
 *
 * @param {Date|String|Number} date - the given date
 * @returns {Number} the seconds
 *
 * @example
 * // Get the seconds of 29 February 2012 11:45:05.123:
 * var result = getSeconds(new Date(2012, 1, 29, 11, 45, 5, 123))
 * //=> 5
 */
function getSeconds (dirtyDate) {
  var date = parse(dirtyDate)
  var seconds = date.getSeconds()
  return seconds
}

module.exports = getSeconds

},{"../parse/index.js":146}],90:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Timestamp Helpers
 * @summary Get the milliseconds timestamp of the given date.
 *
 * @description
 * Get the milliseconds timestamp of the given date.
 *
 * @param {Date|String|Number} date - the given date
 * @returns {Number} the timestamp
 *
 * @example
 * // Get the timestamp of 29 February 2012 11:45:05.123:
 * var result = getTime(new Date(2012, 1, 29, 11, 45, 5, 123))
 * //=> 1330515905123
 */
function getTime (dirtyDate) {
  var date = parse(dirtyDate)
  var timestamp = date.getTime()
  return timestamp
}

module.exports = getTime

},{"../parse/index.js":146}],91:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Year Helpers
 * @summary Get the year of the given date.
 *
 * @description
 * Get the year of the given date.
 *
 * @param {Date|String|Number} date - the given date
 * @returns {Number} the year
 *
 * @example
 * // Which year is 2 July 2014?
 * var result = getYear(new Date(2014, 6, 2))
 * //=> 2014
 */
function getYear (dirtyDate) {
  var date = parse(dirtyDate)
  var year = date.getFullYear()
  return year
}

module.exports = getYear

},{"../parse/index.js":146}],92:[function(require,module,exports){
module.exports = {
  addDays: require('./add_days/index.js'),
  addHours: require('./add_hours/index.js'),
  addISOYears: require('./add_iso_years/index.js'),
  addMilliseconds: require('./add_milliseconds/index.js'),
  addMinutes: require('./add_minutes/index.js'),
  addMonths: require('./add_months/index.js'),
  addQuarters: require('./add_quarters/index.js'),
  addSeconds: require('./add_seconds/index.js'),
  addWeeks: require('./add_weeks/index.js'),
  addYears: require('./add_years/index.js'),
  areRangesOverlapping: require('./are_ranges_overlapping/index.js'),
  closestIndexTo: require('./closest_index_to/index.js'),
  closestTo: require('./closest_to/index.js'),
  compareAsc: require('./compare_asc/index.js'),
  compareDesc: require('./compare_desc/index.js'),
  differenceInCalendarDays: require('./difference_in_calendar_days/index.js'),
  differenceInCalendarISOWeeks: require('./difference_in_calendar_iso_weeks/index.js'),
  differenceInCalendarISOYears: require('./difference_in_calendar_iso_years/index.js'),
  differenceInCalendarMonths: require('./difference_in_calendar_months/index.js'),
  differenceInCalendarQuarters: require('./difference_in_calendar_quarters/index.js'),
  differenceInCalendarWeeks: require('./difference_in_calendar_weeks/index.js'),
  differenceInCalendarYears: require('./difference_in_calendar_years/index.js'),
  differenceInDays: require('./difference_in_days/index.js'),
  differenceInHours: require('./difference_in_hours/index.js'),
  differenceInISOYears: require('./difference_in_iso_years/index.js'),
  differenceInMilliseconds: require('./difference_in_milliseconds/index.js'),
  differenceInMinutes: require('./difference_in_minutes/index.js'),
  differenceInMonths: require('./difference_in_months/index.js'),
  differenceInQuarters: require('./difference_in_quarters/index.js'),
  differenceInSeconds: require('./difference_in_seconds/index.js'),
  differenceInWeeks: require('./difference_in_weeks/index.js'),
  differenceInYears: require('./difference_in_years/index.js'),
  distanceInWords: require('./distance_in_words/index.js'),
  distanceInWordsStrict: require('./distance_in_words_strict/index.js'),
  distanceInWordsToNow: require('./distance_in_words_to_now/index.js'),
  eachDay: require('./each_day/index.js'),
  endOfDay: require('./end_of_day/index.js'),
  endOfHour: require('./end_of_hour/index.js'),
  endOfISOWeek: require('./end_of_iso_week/index.js'),
  endOfISOYear: require('./end_of_iso_year/index.js'),
  endOfMinute: require('./end_of_minute/index.js'),
  endOfMonth: require('./end_of_month/index.js'),
  endOfQuarter: require('./end_of_quarter/index.js'),
  endOfSecond: require('./end_of_second/index.js'),
  endOfToday: require('./end_of_today/index.js'),
  endOfTomorrow: require('./end_of_tomorrow/index.js'),
  endOfWeek: require('./end_of_week/index.js'),
  endOfYear: require('./end_of_year/index.js'),
  endOfYesterday: require('./end_of_yesterday/index.js'),
  format: require('./format/index.js'),
  getDate: require('./get_date/index.js'),
  getDay: require('./get_day/index.js'),
  getDayOfYear: require('./get_day_of_year/index.js'),
  getDaysInMonth: require('./get_days_in_month/index.js'),
  getDaysInYear: require('./get_days_in_year/index.js'),
  getHours: require('./get_hours/index.js'),
  getISODay: require('./get_iso_day/index.js'),
  getISOWeek: require('./get_iso_week/index.js'),
  getISOWeeksInYear: require('./get_iso_weeks_in_year/index.js'),
  getISOYear: require('./get_iso_year/index.js'),
  getMilliseconds: require('./get_milliseconds/index.js'),
  getMinutes: require('./get_minutes/index.js'),
  getMonth: require('./get_month/index.js'),
  getOverlappingDaysInRanges: require('./get_overlapping_days_in_ranges/index.js'),
  getQuarter: require('./get_quarter/index.js'),
  getSeconds: require('./get_seconds/index.js'),
  getTime: require('./get_time/index.js'),
  getYear: require('./get_year/index.js'),
  isAfter: require('./is_after/index.js'),
  isBefore: require('./is_before/index.js'),
  isDate: require('./is_date/index.js'),
  isEqual: require('./is_equal/index.js'),
  isFirstDayOfMonth: require('./is_first_day_of_month/index.js'),
  isFriday: require('./is_friday/index.js'),
  isFuture: require('./is_future/index.js'),
  isLastDayOfMonth: require('./is_last_day_of_month/index.js'),
  isLeapYear: require('./is_leap_year/index.js'),
  isMonday: require('./is_monday/index.js'),
  isPast: require('./is_past/index.js'),
  isSameDay: require('./is_same_day/index.js'),
  isSameHour: require('./is_same_hour/index.js'),
  isSameISOWeek: require('./is_same_iso_week/index.js'),
  isSameISOYear: require('./is_same_iso_year/index.js'),
  isSameMinute: require('./is_same_minute/index.js'),
  isSameMonth: require('./is_same_month/index.js'),
  isSameQuarter: require('./is_same_quarter/index.js'),
  isSameSecond: require('./is_same_second/index.js'),
  isSameWeek: require('./is_same_week/index.js'),
  isSameYear: require('./is_same_year/index.js'),
  isSaturday: require('./is_saturday/index.js'),
  isSunday: require('./is_sunday/index.js'),
  isThisHour: require('./is_this_hour/index.js'),
  isThisISOWeek: require('./is_this_iso_week/index.js'),
  isThisISOYear: require('./is_this_iso_year/index.js'),
  isThisMinute: require('./is_this_minute/index.js'),
  isThisMonth: require('./is_this_month/index.js'),
  isThisQuarter: require('./is_this_quarter/index.js'),
  isThisSecond: require('./is_this_second/index.js'),
  isThisWeek: require('./is_this_week/index.js'),
  isThisYear: require('./is_this_year/index.js'),
  isThursday: require('./is_thursday/index.js'),
  isToday: require('./is_today/index.js'),
  isTomorrow: require('./is_tomorrow/index.js'),
  isTuesday: require('./is_tuesday/index.js'),
  isValid: require('./is_valid/index.js'),
  isWednesday: require('./is_wednesday/index.js'),
  isWeekend: require('./is_weekend/index.js'),
  isWithinRange: require('./is_within_range/index.js'),
  isYesterday: require('./is_yesterday/index.js'),
  lastDayOfISOWeek: require('./last_day_of_iso_week/index.js'),
  lastDayOfISOYear: require('./last_day_of_iso_year/index.js'),
  lastDayOfMonth: require('./last_day_of_month/index.js'),
  lastDayOfQuarter: require('./last_day_of_quarter/index.js'),
  lastDayOfWeek: require('./last_day_of_week/index.js'),
  lastDayOfYear: require('./last_day_of_year/index.js'),
  max: require('./max/index.js'),
  min: require('./min/index.js'),
  parse: require('./parse/index.js'),
  setDate: require('./set_date/index.js'),
  setDay: require('./set_day/index.js'),
  setDayOfYear: require('./set_day_of_year/index.js'),
  setHours: require('./set_hours/index.js'),
  setISODay: require('./set_iso_day/index.js'),
  setISOWeek: require('./set_iso_week/index.js'),
  setISOYear: require('./set_iso_year/index.js'),
  setMilliseconds: require('./set_milliseconds/index.js'),
  setMinutes: require('./set_minutes/index.js'),
  setMonth: require('./set_month/index.js'),
  setQuarter: require('./set_quarter/index.js'),
  setSeconds: require('./set_seconds/index.js'),
  setYear: require('./set_year/index.js'),
  startOfDay: require('./start_of_day/index.js'),
  startOfHour: require('./start_of_hour/index.js'),
  startOfISOWeek: require('./start_of_iso_week/index.js'),
  startOfISOYear: require('./start_of_iso_year/index.js'),
  startOfMinute: require('./start_of_minute/index.js'),
  startOfMonth: require('./start_of_month/index.js'),
  startOfQuarter: require('./start_of_quarter/index.js'),
  startOfSecond: require('./start_of_second/index.js'),
  startOfToday: require('./start_of_today/index.js'),
  startOfTomorrow: require('./start_of_tomorrow/index.js'),
  startOfWeek: require('./start_of_week/index.js'),
  startOfYear: require('./start_of_year/index.js'),
  startOfYesterday: require('./start_of_yesterday/index.js'),
  subDays: require('./sub_days/index.js'),
  subHours: require('./sub_hours/index.js'),
  subISOYears: require('./sub_iso_years/index.js'),
  subMilliseconds: require('./sub_milliseconds/index.js'),
  subMinutes: require('./sub_minutes/index.js'),
  subMonths: require('./sub_months/index.js'),
  subQuarters: require('./sub_quarters/index.js'),
  subSeconds: require('./sub_seconds/index.js'),
  subWeeks: require('./sub_weeks/index.js'),
  subYears: require('./sub_years/index.js')
}

},{"./add_days/index.js":24,"./add_hours/index.js":25,"./add_iso_years/index.js":26,"./add_milliseconds/index.js":27,"./add_minutes/index.js":28,"./add_months/index.js":29,"./add_quarters/index.js":30,"./add_seconds/index.js":31,"./add_weeks/index.js":32,"./add_years/index.js":33,"./are_ranges_overlapping/index.js":34,"./closest_index_to/index.js":35,"./closest_to/index.js":36,"./compare_asc/index.js":37,"./compare_desc/index.js":38,"./difference_in_calendar_days/index.js":39,"./difference_in_calendar_iso_weeks/index.js":40,"./difference_in_calendar_iso_years/index.js":41,"./difference_in_calendar_months/index.js":42,"./difference_in_calendar_quarters/index.js":43,"./difference_in_calendar_weeks/index.js":44,"./difference_in_calendar_years/index.js":45,"./difference_in_days/index.js":46,"./difference_in_hours/index.js":47,"./difference_in_iso_years/index.js":48,"./difference_in_milliseconds/index.js":49,"./difference_in_minutes/index.js":50,"./difference_in_months/index.js":51,"./difference_in_quarters/index.js":52,"./difference_in_seconds/index.js":53,"./difference_in_weeks/index.js":54,"./difference_in_years/index.js":55,"./distance_in_words/index.js":56,"./distance_in_words_strict/index.js":57,"./distance_in_words_to_now/index.js":58,"./each_day/index.js":59,"./end_of_day/index.js":60,"./end_of_hour/index.js":61,"./end_of_iso_week/index.js":62,"./end_of_iso_year/index.js":63,"./end_of_minute/index.js":64,"./end_of_month/index.js":65,"./end_of_quarter/index.js":66,"./end_of_second/index.js":67,"./end_of_today/index.js":68,"./end_of_tomorrow/index.js":69,"./end_of_week/index.js":70,"./end_of_year/index.js":71,"./end_of_yesterday/index.js":72,"./format/index.js":73,"./get_date/index.js":74,"./get_day/index.js":75,"./get_day_of_year/index.js":76,"./get_days_in_month/index.js":77,"./get_days_in_year/index.js":78,"./get_hours/index.js":79,"./get_iso_day/index.js":80,"./get_iso_week/index.js":81,"./get_iso_weeks_in_year/index.js":82,"./get_iso_year/index.js":83,"./get_milliseconds/index.js":84,"./get_minutes/index.js":85,"./get_month/index.js":86,"./get_overlapping_days_in_ranges/index.js":87,"./get_quarter/index.js":88,"./get_seconds/index.js":89,"./get_time/index.js":90,"./get_year/index.js":91,"./is_after/index.js":93,"./is_before/index.js":94,"./is_date/index.js":95,"./is_equal/index.js":96,"./is_first_day_of_month/index.js":97,"./is_friday/index.js":98,"./is_future/index.js":99,"./is_last_day_of_month/index.js":100,"./is_leap_year/index.js":101,"./is_monday/index.js":102,"./is_past/index.js":103,"./is_same_day/index.js":104,"./is_same_hour/index.js":105,"./is_same_iso_week/index.js":106,"./is_same_iso_year/index.js":107,"./is_same_minute/index.js":108,"./is_same_month/index.js":109,"./is_same_quarter/index.js":110,"./is_same_second/index.js":111,"./is_same_week/index.js":112,"./is_same_year/index.js":113,"./is_saturday/index.js":114,"./is_sunday/index.js":115,"./is_this_hour/index.js":116,"./is_this_iso_week/index.js":117,"./is_this_iso_year/index.js":118,"./is_this_minute/index.js":119,"./is_this_month/index.js":120,"./is_this_quarter/index.js":121,"./is_this_second/index.js":122,"./is_this_week/index.js":123,"./is_this_year/index.js":124,"./is_thursday/index.js":125,"./is_today/index.js":126,"./is_tomorrow/index.js":127,"./is_tuesday/index.js":128,"./is_valid/index.js":129,"./is_wednesday/index.js":130,"./is_weekend/index.js":131,"./is_within_range/index.js":132,"./is_yesterday/index.js":133,"./last_day_of_iso_week/index.js":134,"./last_day_of_iso_year/index.js":135,"./last_day_of_month/index.js":136,"./last_day_of_quarter/index.js":137,"./last_day_of_week/index.js":138,"./last_day_of_year/index.js":139,"./max/index.js":144,"./min/index.js":145,"./parse/index.js":146,"./set_date/index.js":147,"./set_day/index.js":148,"./set_day_of_year/index.js":149,"./set_hours/index.js":150,"./set_iso_day/index.js":151,"./set_iso_week/index.js":152,"./set_iso_year/index.js":153,"./set_milliseconds/index.js":154,"./set_minutes/index.js":155,"./set_month/index.js":156,"./set_quarter/index.js":157,"./set_seconds/index.js":158,"./set_year/index.js":159,"./start_of_day/index.js":160,"./start_of_hour/index.js":161,"./start_of_iso_week/index.js":162,"./start_of_iso_year/index.js":163,"./start_of_minute/index.js":164,"./start_of_month/index.js":165,"./start_of_quarter/index.js":166,"./start_of_second/index.js":167,"./start_of_today/index.js":168,"./start_of_tomorrow/index.js":169,"./start_of_week/index.js":170,"./start_of_year/index.js":171,"./start_of_yesterday/index.js":172,"./sub_days/index.js":173,"./sub_hours/index.js":174,"./sub_iso_years/index.js":175,"./sub_milliseconds/index.js":176,"./sub_minutes/index.js":177,"./sub_months/index.js":178,"./sub_quarters/index.js":179,"./sub_seconds/index.js":180,"./sub_weeks/index.js":181,"./sub_years/index.js":182}],93:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Common Helpers
 * @summary Is the first date after the second one?
 *
 * @description
 * Is the first date after the second one?
 *
 * @param {Date|String|Number} date - the date that should be after the other one to return true
 * @param {Date|String|Number} dateToCompare - the date to compare with
 * @returns {Boolean} the first date is after the second date
 *
 * @example
 * // Is 10 July 1989 after 11 February 1987?
 * var result = isAfter(new Date(1989, 6, 10), new Date(1987, 1, 11))
 * //=> true
 */
function isAfter (dirtyDate, dirtyDateToCompare) {
  var date = parse(dirtyDate)
  var dateToCompare = parse(dirtyDateToCompare)
  return date.getTime() > dateToCompare.getTime()
}

module.exports = isAfter

},{"../parse/index.js":146}],94:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Common Helpers
 * @summary Is the first date before the second one?
 *
 * @description
 * Is the first date before the second one?
 *
 * @param {Date|String|Number} date - the date that should be before the other one to return true
 * @param {Date|String|Number} dateToCompare - the date to compare with
 * @returns {Boolean} the first date is before the second date
 *
 * @example
 * // Is 10 July 1989 before 11 February 1987?
 * var result = isBefore(new Date(1989, 6, 10), new Date(1987, 1, 11))
 * //=> false
 */
function isBefore (dirtyDate, dirtyDateToCompare) {
  var date = parse(dirtyDate)
  var dateToCompare = parse(dirtyDateToCompare)
  return date.getTime() < dateToCompare.getTime()
}

module.exports = isBefore

},{"../parse/index.js":146}],95:[function(require,module,exports){
/**
 * @category Common Helpers
 * @summary Is the given argument an instance of Date?
 *
 * @description
 * Is the given argument an instance of Date?
 *
 * @param {*} argument - the argument to check
 * @returns {Boolean} the given argument is an instance of Date
 *
 * @example
 * // Is 'mayonnaise' a Date?
 * var result = isDate('mayonnaise')
 * //=> false
 */
function isDate (argument) {
  return argument instanceof Date
}

module.exports = isDate

},{}],96:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Common Helpers
 * @summary Are the given dates equal?
 *
 * @description
 * Are the given dates equal?
 *
 * @param {Date|String|Number} dateLeft - the first date to compare
 * @param {Date|String|Number} dateRight - the second date to compare
 * @returns {Boolean} the dates are equal
 *
 * @example
 * // Are 2 July 2014 06:30:45.000 and 2 July 2014 06:30:45.500 equal?
 * var result = isEqual(
 *   new Date(2014, 6, 2, 6, 30, 45, 0)
 *   new Date(2014, 6, 2, 6, 30, 45, 500)
 * )
 * //=> false
 */
function isEqual (dirtyLeftDate, dirtyRightDate) {
  var dateLeft = parse(dirtyLeftDate)
  var dateRight = parse(dirtyRightDate)
  return dateLeft.getTime() === dateRight.getTime()
}

module.exports = isEqual

},{"../parse/index.js":146}],97:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Month Helpers
 * @summary Is the given date the first day of a month?
 *
 * @description
 * Is the given date the first day of a month?
 *
 * @param {Date|String|Number} date - the date to check
 * @returns {Boolean} the date is the first day of a month
 *
 * @example
 * // Is 1 September 2014 the first day of a month?
 * var result = isFirstDayOfMonth(new Date(2014, 8, 1))
 * //=> true
 */
function isFirstDayOfMonth (dirtyDate) {
  return parse(dirtyDate).getDate() === 1
}

module.exports = isFirstDayOfMonth

},{"../parse/index.js":146}],98:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Weekday Helpers
 * @summary Is the given date Friday?
 *
 * @description
 * Is the given date Friday?
 *
 * @param {Date|String|Number} date - the date to check
 * @returns {Boolean} the date is Friday
 *
 * @example
 * // Is 26 September 2014 Friday?
 * var result = isFriday(new Date(2014, 8, 26))
 * //=> true
 */
function isFriday (dirtyDate) {
  return parse(dirtyDate).getDay() === 5
}

module.exports = isFriday

},{"../parse/index.js":146}],99:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Common Helpers
 * @summary Is the given date in the future?
 *
 * @description
 * Is the given date in the future?
 *
 * @param {Date|String|Number} date - the date to check
 * @returns {Boolean} the date is in the future
 *
 * @example
 * // If today is 6 October 2014, is 31 December 2014 in the future?
 * var result = isFuture(new Date(2014, 11, 31))
 * //=> true
 */
function isFuture (dirtyDate) {
  return parse(dirtyDate).getTime() > new Date().getTime()
}

module.exports = isFuture

},{"../parse/index.js":146}],100:[function(require,module,exports){
var parse = require('../parse/index.js')
var endOfDay = require('../end_of_day/index.js')
var endOfMonth = require('../end_of_month/index.js')

/**
 * @category Month Helpers
 * @summary Is the given date the last day of a month?
 *
 * @description
 * Is the given date the last day of a month?
 *
 * @param {Date|String|Number} date - the date to check
 * @returns {Boolean} the date is the last day of a month
 *
 * @example
 * // Is 28 February 2014 the last day of a month?
 * var result = isLastDayOfMonth(new Date(2014, 1, 28))
 * //=> true
 */
function isLastDayOfMonth (dirtyDate) {
  var date = parse(dirtyDate)
  return endOfDay(date).getTime() === endOfMonth(date).getTime()
}

module.exports = isLastDayOfMonth

},{"../end_of_day/index.js":60,"../end_of_month/index.js":65,"../parse/index.js":146}],101:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Year Helpers
 * @summary Is the given date in the leap year?
 *
 * @description
 * Is the given date in the leap year?
 *
 * @param {Date|String|Number} date - the date to check
 * @returns {Boolean} the date is in the leap year
 *
 * @example
 * // Is 1 September 2012 in the leap year?
 * var result = isLeapYear(new Date(2012, 8, 1))
 * //=> true
 */
function isLeapYear (dirtyDate) {
  var date = parse(dirtyDate)
  var year = date.getFullYear()
  return year % 400 === 0 || year % 4 === 0 && year % 100 !== 0
}

module.exports = isLeapYear

},{"../parse/index.js":146}],102:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Weekday Helpers
 * @summary Is the given date Monday?
 *
 * @description
 * Is the given date Monday?
 *
 * @param {Date|String|Number} date - the date to check
 * @returns {Boolean} the date is Monday
 *
 * @example
 * // Is 22 September 2014 Monday?
 * var result = isMonday(new Date(2014, 8, 22))
 * //=> true
 */
function isMonday (dirtyDate) {
  return parse(dirtyDate).getDay() === 1
}

module.exports = isMonday

},{"../parse/index.js":146}],103:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Common Helpers
 * @summary Is the given date in the past?
 *
 * @description
 * Is the given date in the past?
 *
 * @param {Date|String|Number} date - the date to check
 * @returns {Boolean} the date is in the past
 *
 * @example
 * // If today is 6 October 2014, is 2 July 2014 in the past?
 * var result = isPast(new Date(2014, 6, 2))
 * //=> true
 */
function isPast (dirtyDate) {
  return parse(dirtyDate).getTime() < new Date().getTime()
}

module.exports = isPast

},{"../parse/index.js":146}],104:[function(require,module,exports){
var startOfDay = require('../start_of_day/index.js')

/**
 * @category Day Helpers
 * @summary Are the given dates in the same day?
 *
 * @description
 * Are the given dates in the same day?
 *
 * @param {Date|String|Number} dateLeft - the first date to check
 * @param {Date|String|Number} dateRight - the second date to check
 * @returns {Boolean} the dates are in the same day
 *
 * @example
 * // Are 4 September 06:00:00 and 4 September 18:00:00 in the same day?
 * var result = isSameDay(
 *   new Date(2014, 8, 4, 6, 0),
 *   new Date(2014, 8, 4, 18, 0)
 * )
 * //=> true
 */
function isSameDay (dirtyDateLeft, dirtyDateRight) {
  var dateLeftStartOfDay = startOfDay(dirtyDateLeft)
  var dateRightStartOfDay = startOfDay(dirtyDateRight)

  return dateLeftStartOfDay.getTime() === dateRightStartOfDay.getTime()
}

module.exports = isSameDay

},{"../start_of_day/index.js":160}],105:[function(require,module,exports){
var startOfHour = require('../start_of_hour/index.js')

/**
 * @category Hour Helpers
 * @summary Are the given dates in the same hour?
 *
 * @description
 * Are the given dates in the same hour?
 *
 * @param {Date|String|Number} dateLeft - the first date to check
 * @param {Date|String|Number} dateRight - the second date to check
 * @returns {Boolean} the dates are in the same hour
 *
 * @example
 * // Are 4 September 2014 06:00:00 and 4 September 06:30:00 in the same hour?
 * var result = isSameHour(
 *   new Date(2014, 8, 4, 6, 0),
 *   new Date(2014, 8, 4, 6, 30)
 * )
 * //=> true
 */
function isSameHour (dirtyDateLeft, dirtyDateRight) {
  var dateLeftStartOfHour = startOfHour(dirtyDateLeft)
  var dateRightStartOfHour = startOfHour(dirtyDateRight)

  return dateLeftStartOfHour.getTime() === dateRightStartOfHour.getTime()
}

module.exports = isSameHour

},{"../start_of_hour/index.js":161}],106:[function(require,module,exports){
var isSameWeek = require('../is_same_week/index.js')

/**
 * @category ISO Week Helpers
 * @summary Are the given dates in the same ISO week?
 *
 * @description
 * Are the given dates in the same ISO week?
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * @param {Date|String|Number} dateLeft - the first date to check
 * @param {Date|String|Number} dateRight - the second date to check
 * @returns {Boolean} the dates are in the same ISO week
 *
 * @example
 * // Are 1 September 2014 and 7 September 2014 in the same ISO week?
 * var result = isSameISOWeek(
 *   new Date(2014, 8, 1),
 *   new Date(2014, 8, 7)
 * )
 * //=> true
 */
function isSameISOWeek (dirtyDateLeft, dirtyDateRight) {
  return isSameWeek(dirtyDateLeft, dirtyDateRight, {weekStartsOn: 1})
}

module.exports = isSameISOWeek

},{"../is_same_week/index.js":112}],107:[function(require,module,exports){
var startOfISOYear = require('../start_of_iso_year/index.js')

/**
 * @category ISO Week-Numbering Year Helpers
 * @summary Are the given dates in the same ISO week-numbering year?
 *
 * @description
 * Are the given dates in the same ISO week-numbering year?
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * @param {Date|String|Number} dateLeft - the first date to check
 * @param {Date|String|Number} dateRight - the second date to check
 * @returns {Boolean} the dates are in the same ISO week-numbering year
 *
 * @example
 * // Are 29 December 2003 and 2 January 2005 in the same ISO week-numbering year?
 * var result = isSameISOYear(
 *   new Date(2003, 11, 29),
 *   new Date(2005, 0, 2)
 * )
 * //=> true
 */
function isSameISOYear (dirtyDateLeft, dirtyDateRight) {
  var dateLeftStartOfYear = startOfISOYear(dirtyDateLeft)
  var dateRightStartOfYear = startOfISOYear(dirtyDateRight)

  return dateLeftStartOfYear.getTime() === dateRightStartOfYear.getTime()
}

module.exports = isSameISOYear

},{"../start_of_iso_year/index.js":163}],108:[function(require,module,exports){
var startOfMinute = require('../start_of_minute/index.js')

/**
 * @category Minute Helpers
 * @summary Are the given dates in the same minute?
 *
 * @description
 * Are the given dates in the same minute?
 *
 * @param {Date|String|Number} dateLeft - the first date to check
 * @param {Date|String|Number} dateRight - the second date to check
 * @returns {Boolean} the dates are in the same minute
 *
 * @example
 * // Are 4 September 2014 06:30:00 and 4 September 2014 06:30:15
 * // in the same minute?
 * var result = isSameMinute(
 *   new Date(2014, 8, 4, 6, 30),
 *   new Date(2014, 8, 4, 6, 30, 15)
 * )
 * //=> true
 */
function isSameMinute (dirtyDateLeft, dirtyDateRight) {
  var dateLeftStartOfMinute = startOfMinute(dirtyDateLeft)
  var dateRightStartOfMinute = startOfMinute(dirtyDateRight)

  return dateLeftStartOfMinute.getTime() === dateRightStartOfMinute.getTime()
}

module.exports = isSameMinute

},{"../start_of_minute/index.js":164}],109:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Month Helpers
 * @summary Are the given dates in the same month?
 *
 * @description
 * Are the given dates in the same month?
 *
 * @param {Date|String|Number} dateLeft - the first date to check
 * @param {Date|String|Number} dateRight - the second date to check
 * @returns {Boolean} the dates are in the same month
 *
 * @example
 * // Are 2 September 2014 and 25 September 2014 in the same month?
 * var result = isSameMonth(
 *   new Date(2014, 8, 2),
 *   new Date(2014, 8, 25)
 * )
 * //=> true
 */
function isSameMonth (dirtyDateLeft, dirtyDateRight) {
  var dateLeft = parse(dirtyDateLeft)
  var dateRight = parse(dirtyDateRight)
  return dateLeft.getFullYear() === dateRight.getFullYear() &&
    dateLeft.getMonth() === dateRight.getMonth()
}

module.exports = isSameMonth

},{"../parse/index.js":146}],110:[function(require,module,exports){
var startOfQuarter = require('../start_of_quarter/index.js')

/**
 * @category Quarter Helpers
 * @summary Are the given dates in the same year quarter?
 *
 * @description
 * Are the given dates in the same year quarter?
 *
 * @param {Date|String|Number} dateLeft - the first date to check
 * @param {Date|String|Number} dateRight - the second date to check
 * @returns {Boolean} the dates are in the same quarter
 *
 * @example
 * // Are 1 January 2014 and 8 March 2014 in the same quarter?
 * var result = isSameQuarter(
 *   new Date(2014, 0, 1),
 *   new Date(2014, 2, 8)
 * )
 * //=> true
 */
function isSameQuarter (dirtyDateLeft, dirtyDateRight) {
  var dateLeftStartOfQuarter = startOfQuarter(dirtyDateLeft)
  var dateRightStartOfQuarter = startOfQuarter(dirtyDateRight)

  return dateLeftStartOfQuarter.getTime() === dateRightStartOfQuarter.getTime()
}

module.exports = isSameQuarter

},{"../start_of_quarter/index.js":166}],111:[function(require,module,exports){
var startOfSecond = require('../start_of_second/index.js')

/**
 * @category Second Helpers
 * @summary Are the given dates in the same second?
 *
 * @description
 * Are the given dates in the same second?
 *
 * @param {Date|String|Number} dateLeft - the first date to check
 * @param {Date|String|Number} dateRight - the second date to check
 * @returns {Boolean} the dates are in the same second
 *
 * @example
 * // Are 4 September 2014 06:30:15.000 and 4 September 2014 06:30.15.500
 * // in the same second?
 * var result = isSameSecond(
 *   new Date(2014, 8, 4, 6, 30, 15),
 *   new Date(2014, 8, 4, 6, 30, 15, 500)
 * )
 * //=> true
 */
function isSameSecond (dirtyDateLeft, dirtyDateRight) {
  var dateLeftStartOfSecond = startOfSecond(dirtyDateLeft)
  var dateRightStartOfSecond = startOfSecond(dirtyDateRight)

  return dateLeftStartOfSecond.getTime() === dateRightStartOfSecond.getTime()
}

module.exports = isSameSecond

},{"../start_of_second/index.js":167}],112:[function(require,module,exports){
var startOfWeek = require('../start_of_week/index.js')

/**
 * @category Week Helpers
 * @summary Are the given dates in the same week?
 *
 * @description
 * Are the given dates in the same week?
 *
 * @param {Date|String|Number} dateLeft - the first date to check
 * @param {Date|String|Number} dateRight - the second date to check
 * @param {Object} [options] - the object with options
 * @param {Number} [options.weekStartsOn=0] - the index of the first day of the week (0 - Sunday)
 * @returns {Boolean} the dates are in the same week
 *
 * @example
 * // Are 31 August 2014 and 4 September 2014 in the same week?
 * var result = isSameWeek(
 *   new Date(2014, 7, 31),
 *   new Date(2014, 8, 4)
 * )
 * //=> true
 *
 * @example
 * // If week starts with Monday,
 * // are 31 August 2014 and 4 September 2014 in the same week?
 * var result = isSameWeek(
 *   new Date(2014, 7, 31),
 *   new Date(2014, 8, 4),
 *   {weekStartsOn: 1}
 * )
 * //=> false
 */
function isSameWeek (dirtyDateLeft, dirtyDateRight, dirtyOptions) {
  var dateLeftStartOfWeek = startOfWeek(dirtyDateLeft, dirtyOptions)
  var dateRightStartOfWeek = startOfWeek(dirtyDateRight, dirtyOptions)

  return dateLeftStartOfWeek.getTime() === dateRightStartOfWeek.getTime()
}

module.exports = isSameWeek

},{"../start_of_week/index.js":170}],113:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Year Helpers
 * @summary Are the given dates in the same year?
 *
 * @description
 * Are the given dates in the same year?
 *
 * @param {Date|String|Number} dateLeft - the first date to check
 * @param {Date|String|Number} dateRight - the second date to check
 * @returns {Boolean} the dates are in the same year
 *
 * @example
 * // Are 2 September 2014 and 25 September 2014 in the same year?
 * var result = isSameYear(
 *   new Date(2014, 8, 2),
 *   new Date(2014, 8, 25)
 * )
 * //=> true
 */
function isSameYear (dirtyDateLeft, dirtyDateRight) {
  var dateLeft = parse(dirtyDateLeft)
  var dateRight = parse(dirtyDateRight)
  return dateLeft.getFullYear() === dateRight.getFullYear()
}

module.exports = isSameYear

},{"../parse/index.js":146}],114:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Weekday Helpers
 * @summary Is the given date Saturday?
 *
 * @description
 * Is the given date Saturday?
 *
 * @param {Date|String|Number} date - the date to check
 * @returns {Boolean} the date is Saturday
 *
 * @example
 * // Is 27 September 2014 Saturday?
 * var result = isSaturday(new Date(2014, 8, 27))
 * //=> true
 */
function isSaturday (dirtyDate) {
  return parse(dirtyDate).getDay() === 6
}

module.exports = isSaturday

},{"../parse/index.js":146}],115:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Weekday Helpers
 * @summary Is the given date Sunday?
 *
 * @description
 * Is the given date Sunday?
 *
 * @param {Date|String|Number} date - the date to check
 * @returns {Boolean} the date is Sunday
 *
 * @example
 * // Is 21 September 2014 Sunday?
 * var result = isSunday(new Date(2014, 8, 21))
 * //=> true
 */
function isSunday (dirtyDate) {
  return parse(dirtyDate).getDay() === 0
}

module.exports = isSunday

},{"../parse/index.js":146}],116:[function(require,module,exports){
var isSameHour = require('../is_same_hour/index.js')

/**
 * @category Hour Helpers
 * @summary Is the given date in the same hour as the current date?
 *
 * @description
 * Is the given date in the same hour as the current date?
 *
 * @param {Date|String|Number} date - the date to check
 * @returns {Boolean} the date is in this hour
 *
 * @example
 * // If now is 25 September 2014 18:30:15.500,
 * // is 25 September 2014 18:00:00 in this hour?
 * var result = isThisHour(new Date(2014, 8, 25, 18))
 * //=> true
 */
function isThisHour (dirtyDate) {
  return isSameHour(new Date(), dirtyDate)
}

module.exports = isThisHour

},{"../is_same_hour/index.js":105}],117:[function(require,module,exports){
var isSameISOWeek = require('../is_same_iso_week/index.js')

/**
 * @category ISO Week Helpers
 * @summary Is the given date in the same ISO week as the current date?
 *
 * @description
 * Is the given date in the same ISO week as the current date?
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * @param {Date|String|Number} date - the date to check
 * @returns {Boolean} the date is in this ISO week
 *
 * @example
 * // If today is 25 September 2014, is 22 September 2014 in this ISO week?
 * var result = isThisISOWeek(new Date(2014, 8, 22))
 * //=> true
 */
function isThisISOWeek (dirtyDate) {
  return isSameISOWeek(new Date(), dirtyDate)
}

module.exports = isThisISOWeek

},{"../is_same_iso_week/index.js":106}],118:[function(require,module,exports){
var isSameISOYear = require('../is_same_iso_year/index.js')

/**
 * @category ISO Week-Numbering Year Helpers
 * @summary Is the given date in the same ISO week-numbering year as the current date?
 *
 * @description
 * Is the given date in the same ISO week-numbering year as the current date?
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * @param {Date|String|Number} date - the date to check
 * @returns {Boolean} the date is in this ISO week-numbering year
 *
 * @example
 * // If today is 25 September 2014,
 * // is 30 December 2013 in this ISO week-numbering year?
 * var result = isThisISOYear(new Date(2013, 11, 30))
 * //=> true
 */
function isThisISOYear (dirtyDate) {
  return isSameISOYear(new Date(), dirtyDate)
}

module.exports = isThisISOYear

},{"../is_same_iso_year/index.js":107}],119:[function(require,module,exports){
var isSameMinute = require('../is_same_minute/index.js')

/**
 * @category Minute Helpers
 * @summary Is the given date in the same minute as the current date?
 *
 * @description
 * Is the given date in the same minute as the current date?
 *
 * @param {Date|String|Number} date - the date to check
 * @returns {Boolean} the date is in this minute
 *
 * @example
 * // If now is 25 September 2014 18:30:15.500,
 * // is 25 September 2014 18:30:00 in this minute?
 * var result = isThisMinute(new Date(2014, 8, 25, 18, 30))
 * //=> true
 */
function isThisMinute (dirtyDate) {
  return isSameMinute(new Date(), dirtyDate)
}

module.exports = isThisMinute

},{"../is_same_minute/index.js":108}],120:[function(require,module,exports){
var isSameMonth = require('../is_same_month/index.js')

/**
 * @category Month Helpers
 * @summary Is the given date in the same month as the current date?
 *
 * @description
 * Is the given date in the same month as the current date?
 *
 * @param {Date|String|Number} date - the date to check
 * @returns {Boolean} the date is in this month
 *
 * @example
 * // If today is 25 September 2014, is 15 September 2014 in this month?
 * var result = isThisMonth(new Date(2014, 8, 15))
 * //=> true
 */
function isThisMonth (dirtyDate) {
  return isSameMonth(new Date(), dirtyDate)
}

module.exports = isThisMonth

},{"../is_same_month/index.js":109}],121:[function(require,module,exports){
var isSameQuarter = require('../is_same_quarter/index.js')

/**
 * @category Quarter Helpers
 * @summary Is the given date in the same quarter as the current date?
 *
 * @description
 * Is the given date in the same quarter as the current date?
 *
 * @param {Date|String|Number} date - the date to check
 * @returns {Boolean} the date is in this quarter
 *
 * @example
 * // If today is 25 September 2014, is 2 July 2014 in this quarter?
 * var result = isThisQuarter(new Date(2014, 6, 2))
 * //=> true
 */
function isThisQuarter (dirtyDate) {
  return isSameQuarter(new Date(), dirtyDate)
}

module.exports = isThisQuarter

},{"../is_same_quarter/index.js":110}],122:[function(require,module,exports){
var isSameSecond = require('../is_same_second/index.js')

/**
 * @category Second Helpers
 * @summary Is the given date in the same second as the current date?
 *
 * @description
 * Is the given date in the same second as the current date?
 *
 * @param {Date|String|Number} date - the date to check
 * @returns {Boolean} the date is in this second
 *
 * @example
 * // If now is 25 September 2014 18:30:15.500,
 * // is 25 September 2014 18:30:15.000 in this second?
 * var result = isThisSecond(new Date(2014, 8, 25, 18, 30, 15))
 * //=> true
 */
function isThisSecond (dirtyDate) {
  return isSameSecond(new Date(), dirtyDate)
}

module.exports = isThisSecond

},{"../is_same_second/index.js":111}],123:[function(require,module,exports){
var isSameWeek = require('../is_same_week/index.js')

/**
 * @category Week Helpers
 * @summary Is the given date in the same week as the current date?
 *
 * @description
 * Is the given date in the same week as the current date?
 *
 * @param {Date|String|Number} date - the date to check
 * @param {Object} [options] - the object with options
 * @param {Number} [options.weekStartsOn=0] - the index of the first day of the week (0 - Sunday)
 * @returns {Boolean} the date is in this week
 *
 * @example
 * // If today is 25 September 2014, is 21 September 2014 in this week?
 * var result = isThisWeek(new Date(2014, 8, 21))
 * //=> true
 *
 * @example
 * // If today is 25 September 2014 and week starts with Monday
 * // is 21 September 2014 in this week?
 * var result = isThisWeek(new Date(2014, 8, 21), {weekStartsOn: 1})
 * //=> false
 */
function isThisWeek (dirtyDate, dirtyOptions) {
  return isSameWeek(new Date(), dirtyDate, dirtyOptions)
}

module.exports = isThisWeek

},{"../is_same_week/index.js":112}],124:[function(require,module,exports){
var isSameYear = require('../is_same_year/index.js')

/**
 * @category Year Helpers
 * @summary Is the given date in the same year as the current date?
 *
 * @description
 * Is the given date in the same year as the current date?
 *
 * @param {Date|String|Number} date - the date to check
 * @returns {Boolean} the date is in this year
 *
 * @example
 * // If today is 25 September 2014, is 2 July 2014 in this year?
 * var result = isThisYear(new Date(2014, 6, 2))
 * //=> true
 */
function isThisYear (dirtyDate) {
  return isSameYear(new Date(), dirtyDate)
}

module.exports = isThisYear

},{"../is_same_year/index.js":113}],125:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Weekday Helpers
 * @summary Is the given date Thursday?
 *
 * @description
 * Is the given date Thursday?
 *
 * @param {Date|String|Number} date - the date to check
 * @returns {Boolean} the date is Thursday
 *
 * @example
 * // Is 25 September 2014 Thursday?
 * var result = isThursday(new Date(2014, 8, 25))
 * //=> true
 */
function isThursday (dirtyDate) {
  return parse(dirtyDate).getDay() === 4
}

module.exports = isThursday

},{"../parse/index.js":146}],126:[function(require,module,exports){
var startOfDay = require('../start_of_day/index.js')

/**
 * @category Day Helpers
 * @summary Is the given date today?
 *
 * @description
 * Is the given date today?
 *
 * @param {Date|String|Number} date - the date to check
 * @returns {Boolean} the date is today
 *
 * @example
 * // If today is 6 October 2014, is 6 October 14:00:00 today?
 * var result = isToday(new Date(2014, 9, 6, 14, 0))
 * //=> true
 */
function isToday (dirtyDate) {
  return startOfDay(dirtyDate).getTime() === startOfDay(new Date()).getTime()
}

module.exports = isToday

},{"../start_of_day/index.js":160}],127:[function(require,module,exports){
var startOfDay = require('../start_of_day/index.js')

/**
 * @category Day Helpers
 * @summary Is the given date tomorrow?
 *
 * @description
 * Is the given date tomorrow?
 *
 * @param {Date|String|Number} date - the date to check
 * @returns {Boolean} the date is tomorrow
 *
 * @example
 * // If today is 6 October 2014, is 7 October 14:00:00 tomorrow?
 * var result = isTomorrow(new Date(2014, 9, 7, 14, 0))
 * //=> true
 */
function isTomorrow (dirtyDate) {
  var tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return startOfDay(dirtyDate).getTime() === startOfDay(tomorrow).getTime()
}

module.exports = isTomorrow

},{"../start_of_day/index.js":160}],128:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Weekday Helpers
 * @summary Is the given date Tuesday?
 *
 * @description
 * Is the given date Tuesday?
 *
 * @param {Date|String|Number} date - the date to check
 * @returns {Boolean} the date is Tuesday
 *
 * @example
 * // Is 23 September 2014 Tuesday?
 * var result = isTuesday(new Date(2014, 8, 23))
 * //=> true
 */
function isTuesday (dirtyDate) {
  return parse(dirtyDate).getDay() === 2
}

module.exports = isTuesday

},{"../parse/index.js":146}],129:[function(require,module,exports){
var isDate = require('../is_date/index.js')

/**
 * @category Common Helpers
 * @summary Is the given date valid?
 *
 * @description
 * Returns false if argument is Invalid Date and true otherwise.
 * Invalid Date is a Date, whose time value is NaN.
 *
 * Time value of Date: http://es5.github.io/#x15.9.1.1
 *
 * @param {Date} date - the date to check
 * @returns {Boolean} the date is valid
 * @throws {TypeError} argument must be an instance of Date
 *
 * @example
 * // For the valid date:
 * var result = isValid(new Date(2014, 1, 31))
 * //=> true
 *
 * @example
 * // For the invalid date:
 * var result = isValid(new Date(''))
 * //=> false
 */
function isValid (dirtyDate) {
  if (isDate(dirtyDate)) {
    return !isNaN(dirtyDate)
  } else {
    throw new TypeError(toString.call(dirtyDate) + ' is not an instance of Date')
  }
}

module.exports = isValid

},{"../is_date/index.js":95}],130:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Weekday Helpers
 * @summary Is the given date Wednesday?
 *
 * @description
 * Is the given date Wednesday?
 *
 * @param {Date|String|Number} date - the date to check
 * @returns {Boolean} the date is Wednesday
 *
 * @example
 * // Is 24 September 2014 Wednesday?
 * var result = isWednesday(new Date(2014, 8, 24))
 * //=> true
 */
function isWednesday (dirtyDate) {
  return parse(dirtyDate).getDay() === 3
}

module.exports = isWednesday

},{"../parse/index.js":146}],131:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Weekday Helpers
 * @summary Does the given date fall on a weekend?
 *
 * @description
 * Does the given date fall on a weekend?
 *
 * @param {Date|String|Number} date - the date to check
 * @returns {Boolean} the date falls on a weekend
 *
 * @example
 * // Does 5 October 2014 fall on a weekend?
 * var result = isWeekend(new Date(2014, 9, 5))
 * //=> true
 */
function isWeekend (dirtyDate) {
  var date = parse(dirtyDate)
  var day = date.getDay()
  return day === 0 || day === 6
}

module.exports = isWeekend

},{"../parse/index.js":146}],132:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Range Helpers
 * @summary Is the given date within the range?
 *
 * @description
 * Is the given date within the range?
 *
 * @param {Date|String|Number} date - the date to check
 * @param {Date|String|Number} startDate - the start of range
 * @param {Date|String|Number} endDate - the end of range
 * @returns {Boolean} the date is within the range
 * @throws {Error} startDate cannot be after endDate
 *
 * @example
 * // For the date within the range:
 * isWithinRange(
 *   new Date(2014, 0, 3), new Date(2014, 0, 1), new Date(2014, 0, 7)
 * )
 * //=> true
 *
 * @example
 * // For the date outside of the range:
 * isWithinRange(
 *   new Date(2014, 0, 10), new Date(2014, 0, 1), new Date(2014, 0, 7)
 * )
 * //=> false
 */
function isWithinRange (dirtyDate, dirtyStartDate, dirtyEndDate) {
  var time = parse(dirtyDate).getTime()
  var startTime = parse(dirtyStartDate).getTime()
  var endTime = parse(dirtyEndDate).getTime()

  if (startTime > endTime) {
    throw new Error('The start of the range cannot be after the end of the range')
  }

  return time >= startTime && time <= endTime
}

module.exports = isWithinRange

},{"../parse/index.js":146}],133:[function(require,module,exports){
var startOfDay = require('../start_of_day/index.js')

/**
 * @category Day Helpers
 * @summary Is the given date yesterday?
 *
 * @description
 * Is the given date yesterday?
 *
 * @param {Date|String|Number} date - the date to check
 * @returns {Boolean} the date is yesterday
 *
 * @example
 * // If today is 6 October 2014, is 5 October 14:00:00 yesterday?
 * var result = isYesterday(new Date(2014, 9, 5, 14, 0))
 * //=> true
 */
function isYesterday (dirtyDate) {
  var yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return startOfDay(dirtyDate).getTime() === startOfDay(yesterday).getTime()
}

module.exports = isYesterday

},{"../start_of_day/index.js":160}],134:[function(require,module,exports){
var lastDayOfWeek = require('../last_day_of_week/index.js')

/**
 * @category ISO Week Helpers
 * @summary Return the last day of an ISO week for the given date.
 *
 * @description
 * Return the last day of an ISO week for the given date.
 * The result will be in the local timezone.
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * @param {Date|String|Number} date - the original date
 * @returns {Date} the last day of an ISO week
 *
 * @example
 * // The last day of an ISO week for 2 September 2014 11:55:00:
 * var result = lastDayOfISOWeek(new Date(2014, 8, 2, 11, 55, 0))
 * //=> Sun Sep 07 2014 00:00:00
 */
function lastDayOfISOWeek (dirtyDate) {
  return lastDayOfWeek(dirtyDate, {weekStartsOn: 1})
}

module.exports = lastDayOfISOWeek

},{"../last_day_of_week/index.js":138}],135:[function(require,module,exports){
var getISOYear = require('../get_iso_year/index.js')
var startOfISOWeek = require('../start_of_iso_week/index.js')

/**
 * @category ISO Week-Numbering Year Helpers
 * @summary Return the last day of an ISO week-numbering year for the given date.
 *
 * @description
 * Return the last day of an ISO week-numbering year,
 * which always starts 3 days before the year's first Thursday.
 * The result will be in the local timezone.
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * @param {Date|String|Number} date - the original date
 * @returns {Date} the end of an ISO week-numbering year
 *
 * @example
 * // The last day of an ISO week-numbering year for 2 July 2005:
 * var result = lastDayOfISOYear(new Date(2005, 6, 2))
 * //=> Sun Jan 01 2006 00:00:00
 */
function lastDayOfISOYear (dirtyDate) {
  var year = getISOYear(dirtyDate)
  var fourthOfJanuary = new Date(0)
  fourthOfJanuary.setFullYear(year + 1, 0, 4)
  fourthOfJanuary.setHours(0, 0, 0, 0)
  var date = startOfISOWeek(fourthOfJanuary)
  date.setDate(date.getDate() - 1)
  return date
}

module.exports = lastDayOfISOYear

},{"../get_iso_year/index.js":83,"../start_of_iso_week/index.js":162}],136:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Month Helpers
 * @summary Return the last day of a month for the given date.
 *
 * @description
 * Return the last day of a month for the given date.
 * The result will be in the local timezone.
 *
 * @param {Date|String|Number} date - the original date
 * @returns {Date} the last day of a month
 *
 * @example
 * // The last day of a month for 2 September 2014 11:55:00:
 * var result = lastDayOfMonth(new Date(2014, 8, 2, 11, 55, 0))
 * //=> Tue Sep 30 2014 00:00:00
 */
function lastDayOfMonth (dirtyDate) {
  var date = parse(dirtyDate)
  var month = date.getMonth()
  date.setFullYear(date.getFullYear(), month + 1, 0)
  date.setHours(0, 0, 0, 0)
  return date
}

module.exports = lastDayOfMonth

},{"../parse/index.js":146}],137:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Quarter Helpers
 * @summary Return the last day of a year quarter for the given date.
 *
 * @description
 * Return the last day of a year quarter for the given date.
 * The result will be in the local timezone.
 *
 * @param {Date|String|Number} date - the original date
 * @returns {Date} the last day of a quarter
 *
 * @example
 * // The last day of a quarter for 2 September 2014 11:55:00:
 * var result = lastDayOfQuarter(new Date(2014, 8, 2, 11, 55, 0))
 * //=> Tue Sep 30 2014 00:00:00
 */
function lastDayOfQuarter (dirtyDate) {
  var date = parse(dirtyDate)
  var currentMonth = date.getMonth()
  var month = currentMonth - currentMonth % 3 + 3
  date.setMonth(month, 0)
  date.setHours(0, 0, 0, 0)
  return date
}

module.exports = lastDayOfQuarter

},{"../parse/index.js":146}],138:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Week Helpers
 * @summary Return the last day of a week for the given date.
 *
 * @description
 * Return the last day of a week for the given date.
 * The result will be in the local timezone.
 *
 * @param {Date|String|Number} date - the original date
 * @param {Object} [options] - the object with options
 * @param {Number} [options.weekStartsOn=0] - the index of the first day of the week (0 - Sunday)
 * @returns {Date} the last day of a week
 *
 * @example
 * // The last day of a week for 2 September 2014 11:55:00:
 * var result = lastDayOfWeek(new Date(2014, 8, 2, 11, 55, 0))
 * //=> Sat Sep 06 2014 00:00:00
 *
 * @example
 * // If the week starts on Monday, the last day of the week for 2 September 2014 11:55:00:
 * var result = lastDayOfWeek(new Date(2014, 8, 2, 11, 55, 0), {weekStartsOn: 1})
 * //=> Sun Sep 07 2014 00:00:00
 */
function lastDayOfWeek (dirtyDate, dirtyOptions) {
  var weekStartsOn = dirtyOptions ? (Number(dirtyOptions.weekStartsOn) || 0) : 0

  var date = parse(dirtyDate)
  var day = date.getDay()
  var diff = (day < weekStartsOn ? -7 : 0) + 6 - (day - weekStartsOn)

  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + diff)
  return date
}

module.exports = lastDayOfWeek

},{"../parse/index.js":146}],139:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Year Helpers
 * @summary Return the last day of a year for the given date.
 *
 * @description
 * Return the last day of a year for the given date.
 * The result will be in the local timezone.
 *
 * @param {Date|String|Number} date - the original date
 * @returns {Date} the last day of a year
 *
 * @example
 * // The last day of a year for 2 September 2014 11:55:00:
 * var result = lastDayOfYear(new Date(2014, 8, 2, 11, 55, 00))
 * //=> Wed Dec 31 2014 00:00:00
 */
function lastDayOfYear (dirtyDate) {
  var date = parse(dirtyDate)
  var year = date.getFullYear()
  date.setFullYear(year + 1, 0, 0)
  date.setHours(0, 0, 0, 0)
  return date
}

module.exports = lastDayOfYear

},{"../parse/index.js":146}],140:[function(require,module,exports){
var commonFormatterKeys = [
  'M', 'MM', 'Q', 'D', 'DD', 'DDD', 'DDDD', 'd',
  'E', 'W', 'WW', 'YY', 'YYYY', 'GG', 'GGGG',
  'H', 'HH', 'h', 'hh', 'm', 'mm',
  's', 'ss', 'S', 'SS', 'SSS',
  'Z', 'ZZ', 'X', 'x'
]

function buildFormattingTokensRegExp (formatters) {
  var formatterKeys = []
  for (var key in formatters) {
    if (formatters.hasOwnProperty(key)) {
      formatterKeys.push(key)
    }
  }

  var formattingTokens = commonFormatterKeys
    .concat(formatterKeys)
    .sort()
    .reverse()
  var formattingTokensRegExp = new RegExp(
    '(\\[[^\\[]*\\])|(\\\\)?' + '(' + formattingTokens.join('|') + '|.)', 'g'
  )

  return formattingTokensRegExp
}

module.exports = buildFormattingTokensRegExp

},{}],141:[function(require,module,exports){
function buildDistanceInWordsLocale () {
  var distanceInWordsLocale = {
    lessThanXSeconds: {
      one: 'less than a second',
      other: 'less than {{count}} seconds'
    },

    xSeconds: {
      one: '1 second',
      other: '{{count}} seconds'
    },

    halfAMinute: 'half a minute',

    lessThanXMinutes: {
      one: 'less than a minute',
      other: 'less than {{count}} minutes'
    },

    xMinutes: {
      one: '1 minute',
      other: '{{count}} minutes'
    },

    aboutXHours: {
      one: 'about 1 hour',
      other: 'about {{count}} hours'
    },

    xHours: {
      one: '1 hour',
      other: '{{count}} hours'
    },

    xDays: {
      one: '1 day',
      other: '{{count}} days'
    },

    aboutXMonths: {
      one: 'about 1 month',
      other: 'about {{count}} months'
    },

    xMonths: {
      one: '1 month',
      other: '{{count}} months'
    },

    aboutXYears: {
      one: 'about 1 year',
      other: 'about {{count}} years'
    },

    xYears: {
      one: '1 year',
      other: '{{count}} years'
    },

    overXYears: {
      one: 'over 1 year',
      other: 'over {{count}} years'
    },

    almostXYears: {
      one: 'almost 1 year',
      other: 'almost {{count}} years'
    }
  }

  function localize (token, count, options) {
    options = options || {}

    var result
    if (typeof distanceInWordsLocale[token] === 'string') {
      result = distanceInWordsLocale[token]
    } else if (count === 1) {
      result = distanceInWordsLocale[token].one
    } else {
      result = distanceInWordsLocale[token].other.replace('{{count}}', count)
    }

    if (options.addSuffix) {
      if (options.comparison > 0) {
        return 'in ' + result
      } else {
        return result + ' ago'
      }
    }

    return result
  }

  return {
    localize: localize
  }
}

module.exports = buildDistanceInWordsLocale

},{}],142:[function(require,module,exports){
var buildFormattingTokensRegExp = require('../../_lib/build_formatting_tokens_reg_exp/index.js')

function buildFormatLocale () {
  // Note: in English, the names of days of the week and months are capitalized.
  // If you are making a new locale based on this one, check if the same is true for the language you're working on.
  // Generally, formatted dates should look like they are in the middle of a sentence,
  // e.g. in Spanish language the weekdays and months should be in the lowercase.
  var months3char = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  var monthsFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  var weekdays2char = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  var weekdays3char = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  var weekdaysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  var meridiemUppercase = ['AM', 'PM']
  var meridiemLowercase = ['am', 'pm']
  var meridiemFull = ['a.m.', 'p.m.']

  var formatters = {
    // Month: Jan, Feb, ..., Dec
    'MMM': function (date) {
      return months3char[date.getMonth()]
    },

    // Month: January, February, ..., December
    'MMMM': function (date) {
      return monthsFull[date.getMonth()]
    },

    // Day of week: Su, Mo, ..., Sa
    'dd': function (date) {
      return weekdays2char[date.getDay()]
    },

    // Day of week: Sun, Mon, ..., Sat
    'ddd': function (date) {
      return weekdays3char[date.getDay()]
    },

    // Day of week: Sunday, Monday, ..., Saturday
    'dddd': function (date) {
      return weekdaysFull[date.getDay()]
    },

    // AM, PM
    'A': function (date) {
      return (date.getHours() / 12) >= 1 ? meridiemUppercase[1] : meridiemUppercase[0]
    },

    // am, pm
    'a': function (date) {
      return (date.getHours() / 12) >= 1 ? meridiemLowercase[1] : meridiemLowercase[0]
    },

    // a.m., p.m.
    'aa': function (date) {
      return (date.getHours() / 12) >= 1 ? meridiemFull[1] : meridiemFull[0]
    }
  }

  // Generate ordinal version of formatters: M -> Mo, D -> Do, etc.
  var ordinalFormatters = ['M', 'D', 'DDD', 'd', 'Q', 'W']
  ordinalFormatters.forEach(function (formatterToken) {
    formatters[formatterToken + 'o'] = function (date, formatters) {
      return ordinal(formatters[formatterToken](date))
    }
  })

  return {
    formatters: formatters,
    formattingTokensRegExp: buildFormattingTokensRegExp(formatters)
  }
}

function ordinal (number) {
  var rem100 = number % 100
  if (rem100 > 20 || rem100 < 10) {
    switch (rem100 % 10) {
      case 1:
        return number + 'st'
      case 2:
        return number + 'nd'
      case 3:
        return number + 'rd'
    }
  }
  return number + 'th'
}

module.exports = buildFormatLocale

},{"../../_lib/build_formatting_tokens_reg_exp/index.js":140}],143:[function(require,module,exports){
var buildDistanceInWordsLocale = require('./build_distance_in_words_locale/index.js')
var buildFormatLocale = require('./build_format_locale/index.js')

/**
 * @category Locales
 * @summary English locale.
 */
module.exports = {
  distanceInWords: buildDistanceInWordsLocale(),
  format: buildFormatLocale()
}

},{"./build_distance_in_words_locale/index.js":141,"./build_format_locale/index.js":142}],144:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Common Helpers
 * @summary Return the latest of the given dates.
 *
 * @description
 * Return the latest of the given dates.
 *
 * @param {...(Date|String|Number)} dates - the dates to compare
 * @returns {Date} the latest of the dates
 *
 * @example
 * // Which of these dates is the latest?
 * var result = max(
 *   new Date(1989, 6, 10),
 *   new Date(1987, 1, 11),
 *   new Date(1995, 6, 2),
 *   new Date(1990, 0, 1)
 * )
 * //=> Sun Jul 02 1995 00:00:00
 */
function max () {
  var dirtyDates = Array.prototype.slice.call(arguments)
  var dates = dirtyDates.map(function (dirtyDate) {
    return parse(dirtyDate)
  })
  var latestTimestamp = Math.max.apply(null, dates)
  return new Date(latestTimestamp)
}

module.exports = max

},{"../parse/index.js":146}],145:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Common Helpers
 * @summary Return the earliest of the given dates.
 *
 * @description
 * Return the earliest of the given dates.
 *
 * @param {...(Date|String|Number)} dates - the dates to compare
 * @returns {Date} the earliest of the dates
 *
 * @example
 * // Which of these dates is the earliest?
 * var result = min(
 *   new Date(1989, 6, 10),
 *   new Date(1987, 1, 11),
 *   new Date(1995, 6, 2),
 *   new Date(1990, 0, 1)
 * )
 * //=> Wed Feb 11 1987 00:00:00
 */
function min () {
  var dirtyDates = Array.prototype.slice.call(arguments)
  var dates = dirtyDates.map(function (dirtyDate) {
    return parse(dirtyDate)
  })
  var earliestTimestamp = Math.min.apply(null, dates)
  return new Date(earliestTimestamp)
}

module.exports = min

},{"../parse/index.js":146}],146:[function(require,module,exports){
var isDate = require('../is_date/index.js')

var MILLISECONDS_IN_HOUR = 3600000
var MILLISECONDS_IN_MINUTE = 60000
var DEFAULT_ADDITIONAL_DIGITS = 2

var parseTokenDateTimeDelimeter = /[T ]/
var parseTokenPlainTime = /:/

// year tokens
var parseTokenYY = /^(\d{2})$/
var parseTokensYYY = [
  /^([+-]\d{2})$/, // 0 additional digits
  /^([+-]\d{3})$/, // 1 additional digit
  /^([+-]\d{4})$/ // 2 additional digits
]

var parseTokenYYYY = /^(\d{4})/
var parseTokensYYYYY = [
  /^([+-]\d{4})/, // 0 additional digits
  /^([+-]\d{5})/, // 1 additional digit
  /^([+-]\d{6})/ // 2 additional digits
]

// date tokens
var parseTokenMM = /^-(\d{2})$/
var parseTokenDDD = /^-?(\d{3})$/
var parseTokenMMDD = /^-?(\d{2})-?(\d{2})$/
var parseTokenWww = /^-?W(\d{2})$/
var parseTokenWwwD = /^-?W(\d{2})-?(\d{1})$/

// time tokens
var parseTokenHH = /^(\d{2}([.,]\d*)?)$/
var parseTokenHHMM = /^(\d{2}):?(\d{2}([.,]\d*)?)$/
var parseTokenHHMMSS = /^(\d{2}):?(\d{2}):?(\d{2}([.,]\d*)?)$/

// timezone tokens
var parseTokenTimezone = /([Z+-].*)$/
var parseTokenTimezoneZ = /^(Z)$/
var parseTokenTimezoneHH = /^([+-])(\d{2})$/
var parseTokenTimezoneHHMM = /^([+-])(\d{2}):?(\d{2})$/

/**
 * @category Common Helpers
 * @summary Convert the given argument to an instance of Date.
 *
 * @description
 * Convert the given argument to an instance of Date.
 *
 * If the argument is an instance of Date, the function returns its clone.
 *
 * If the argument is a number, it is treated as a timestamp.
 *
 * If an argument is a string, the function tries to parse it.
 * Function accepts complete ISO 8601 formats as well as partial implementations.
 * ISO 8601: http://en.wikipedia.org/wiki/ISO_8601
 *
 * If all above fails, the function passes the given argument to Date constructor.
 *
 * @param {Date|String|Number} argument - the value to convert
 * @param {Object} [options] - the object with options
 * @param {0 | 1 | 2} [options.additionalDigits=2] - the additional number of digits in the extended year format
 * @returns {Date} the parsed date in the local time zone
 *
 * @example
 * // Convert string '2014-02-11T11:30:30' to date:
 * var result = parse('2014-02-11T11:30:30')
 * //=> Tue Feb 11 2014 11:30:30
 *
 * @example
 * // Parse string '+02014101',
 * // if the additional number of digits in the extended year format is 1:
 * var result = parse('+02014101', {additionalDigits: 1})
 * //=> Fri Apr 11 2014 00:00:00
 */
function parse (argument, dirtyOptions) {
  if (isDate(argument)) {
    // Prevent the date to lose the milliseconds when passed to new Date() in IE10
    return new Date(argument.getTime())
  } else if (typeof argument !== 'string') {
    return new Date(argument)
  }

  var options = dirtyOptions || {}
  var additionalDigits = options.additionalDigits
  if (additionalDigits == null) {
    additionalDigits = DEFAULT_ADDITIONAL_DIGITS
  } else {
    additionalDigits = Number(additionalDigits)
  }

  var dateStrings = splitDateString(argument)

  var parseYearResult = parseYear(dateStrings.date, additionalDigits)
  var year = parseYearResult.year
  var restDateString = parseYearResult.restDateString

  var date = parseDate(restDateString, year)

  if (date) {
    var timestamp = date.getTime()
    var time = 0
    var offset

    if (dateStrings.time) {
      time = parseTime(dateStrings.time)
    }

    if (dateStrings.timezone) {
      offset = parseTimezone(dateStrings.timezone)
    } else {
      // get offset accurate to hour in timezones that change offset
      offset = new Date(timestamp + time).getTimezoneOffset()
      offset = new Date(timestamp + time + offset * MILLISECONDS_IN_MINUTE).getTimezoneOffset()
    }

    return new Date(timestamp + time + offset * MILLISECONDS_IN_MINUTE)
  } else {
    return new Date(argument)
  }
}

function splitDateString (dateString) {
  var dateStrings = {}
  var array = dateString.split(parseTokenDateTimeDelimeter)
  var timeString

  if (parseTokenPlainTime.test(array[0])) {
    dateStrings.date = null
    timeString = array[0]
  } else {
    dateStrings.date = array[0]
    timeString = array[1]
  }

  if (timeString) {
    var token = parseTokenTimezone.exec(timeString)
    if (token) {
      dateStrings.time = timeString.replace(token[1], '')
      dateStrings.timezone = token[1]
    } else {
      dateStrings.time = timeString
    }
  }

  return dateStrings
}

function parseYear (dateString, additionalDigits) {
  var parseTokenYYY = parseTokensYYY[additionalDigits]
  var parseTokenYYYYY = parseTokensYYYYY[additionalDigits]

  var token

  // YYYY or ±YYYYY
  token = parseTokenYYYY.exec(dateString) || parseTokenYYYYY.exec(dateString)
  if (token) {
    var yearString = token[1]
    return {
      year: parseInt(yearString, 10),
      restDateString: dateString.slice(yearString.length)
    }
  }

  // YY or ±YYY
  token = parseTokenYY.exec(dateString) || parseTokenYYY.exec(dateString)
  if (token) {
    var centuryString = token[1]
    return {
      year: parseInt(centuryString, 10) * 100,
      restDateString: dateString.slice(centuryString.length)
    }
  }

  // Invalid ISO-formatted year
  return {
    year: null
  }
}

function parseDate (dateString, year) {
  // Invalid ISO-formatted year
  if (year === null) {
    return null
  }

  var token
  var date
  var month
  var week

  // YYYY
  if (dateString.length === 0) {
    date = new Date(0)
    date.setUTCFullYear(year)
    return date
  }

  // YYYY-MM
  token = parseTokenMM.exec(dateString)
  if (token) {
    date = new Date(0)
    month = parseInt(token[1], 10) - 1
    date.setUTCFullYear(year, month)
    return date
  }

  // YYYY-DDD or YYYYDDD
  token = parseTokenDDD.exec(dateString)
  if (token) {
    date = new Date(0)
    var dayOfYear = parseInt(token[1], 10)
    date.setUTCFullYear(year, 0, dayOfYear)
    return date
  }

  // YYYY-MM-DD or YYYYMMDD
  token = parseTokenMMDD.exec(dateString)
  if (token) {
    date = new Date(0)
    month = parseInt(token[1], 10) - 1
    var day = parseInt(token[2], 10)
    date.setUTCFullYear(year, month, day)
    return date
  }

  // YYYY-Www or YYYYWww
  token = parseTokenWww.exec(dateString)
  if (token) {
    week = parseInt(token[1], 10) - 1
    return dayOfISOYear(year, week)
  }

  // YYYY-Www-D or YYYYWwwD
  token = parseTokenWwwD.exec(dateString)
  if (token) {
    week = parseInt(token[1], 10) - 1
    var dayOfWeek = parseInt(token[2], 10) - 1
    return dayOfISOYear(year, week, dayOfWeek)
  }

  // Invalid ISO-formatted date
  return null
}

function parseTime (timeString) {
  var token
  var hours
  var minutes

  // hh
  token = parseTokenHH.exec(timeString)
  if (token) {
    hours = parseFloat(token[1].replace(',', '.'))
    return (hours % 24) * MILLISECONDS_IN_HOUR
  }

  // hh:mm or hhmm
  token = parseTokenHHMM.exec(timeString)
  if (token) {
    hours = parseInt(token[1], 10)
    minutes = parseFloat(token[2].replace(',', '.'))
    return (hours % 24) * MILLISECONDS_IN_HOUR +
      minutes * MILLISECONDS_IN_MINUTE
  }

  // hh:mm:ss or hhmmss
  token = parseTokenHHMMSS.exec(timeString)
  if (token) {
    hours = parseInt(token[1], 10)
    minutes = parseInt(token[2], 10)
    var seconds = parseFloat(token[3].replace(',', '.'))
    return (hours % 24) * MILLISECONDS_IN_HOUR +
      minutes * MILLISECONDS_IN_MINUTE +
      seconds * 1000
  }

  // Invalid ISO-formatted time
  return null
}

function parseTimezone (timezoneString) {
  var token
  var absoluteOffset

  // Z
  token = parseTokenTimezoneZ.exec(timezoneString)
  if (token) {
    return 0
  }

  // ±hh
  token = parseTokenTimezoneHH.exec(timezoneString)
  if (token) {
    absoluteOffset = parseInt(token[2], 10) * 60
    return (token[1] === '+') ? -absoluteOffset : absoluteOffset
  }

  // ±hh:mm or ±hhmm
  token = parseTokenTimezoneHHMM.exec(timezoneString)
  if (token) {
    absoluteOffset = parseInt(token[2], 10) * 60 + parseInt(token[3], 10)
    return (token[1] === '+') ? -absoluteOffset : absoluteOffset
  }

  return 0
}

function dayOfISOYear (isoYear, week, day) {
  week = week || 0
  day = day || 0
  var date = new Date(0)
  date.setUTCFullYear(isoYear, 0, 4)
  var fourthOfJanuaryDay = date.getUTCDay() || 7
  var diff = week * 7 + day + 1 - fourthOfJanuaryDay
  date.setUTCDate(date.getUTCDate() + diff)
  return date
}

module.exports = parse

},{"../is_date/index.js":95}],147:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Day Helpers
 * @summary Set the day of the month to the given date.
 *
 * @description
 * Set the day of the month to the given date.
 *
 * @param {Date|String|Number} date - the date to be changed
 * @param {Number} dayOfMonth - the day of the month of the new date
 * @returns {Date} the new date with the day of the month setted
 *
 * @example
 * // Set the 30th day of the month to 1 September 2014:
 * var result = setDate(new Date(2014, 8, 1), 30)
 * //=> Tue Sep 30 2014 00:00:00
 */
function setDate (dirtyDate, dirtyDayOfMonth) {
  var date = parse(dirtyDate)
  var dayOfMonth = Number(dirtyDayOfMonth)
  date.setDate(dayOfMonth)
  return date
}

module.exports = setDate

},{"../parse/index.js":146}],148:[function(require,module,exports){
var parse = require('../parse/index.js')
var addDays = require('../add_days/index.js')

/**
 * @category Weekday Helpers
 * @summary Set the day of the week to the given date.
 *
 * @description
 * Set the day of the week to the given date.
 *
 * @param {Date|String|Number} date - the date to be changed
 * @param {Number} day - the day of the week of the new date
 * @param {Object} [options] - the object with options
 * @param {Number} [options.weekStartsOn=0] - the index of the first day of the week (0 - Sunday)
 * @returns {Date} the new date with the day of the week setted
 *
 * @example
 * // Set Sunday to 1 September 2014:
 * var result = setDay(new Date(2014, 8, 1), 0)
 * //=> Sun Aug 31 2014 00:00:00
 *
 * @example
 * // If week starts with Monday, set Sunday to 1 September 2014:
 * var result = setDay(new Date(2014, 8, 1), 0, {weekStartsOn: 1})
 * //=> Sun Sep 07 2014 00:00:00
 */
function setDay (dirtyDate, dirtyDay, dirtyOptions) {
  var weekStartsOn = dirtyOptions ? (Number(dirtyOptions.weekStartsOn) || 0) : 0
  var date = parse(dirtyDate)
  var day = Number(dirtyDay)
  var currentDay = date.getDay()

  var remainder = day % 7
  var dayIndex = (remainder + 7) % 7

  var diff = (dayIndex < weekStartsOn ? 7 : 0) + day - currentDay
  return addDays(date, diff)
}

module.exports = setDay

},{"../add_days/index.js":24,"../parse/index.js":146}],149:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Day Helpers
 * @summary Set the day of the year to the given date.
 *
 * @description
 * Set the day of the year to the given date.
 *
 * @param {Date|String|Number} date - the date to be changed
 * @param {Number} dayOfYear - the day of the year of the new date
 * @returns {Date} the new date with the day of the year setted
 *
 * @example
 * // Set the 2nd day of the year to 2 July 2014:
 * var result = setDayOfYear(new Date(2014, 6, 2), 2)
 * //=> Thu Jan 02 2014 00:00:00
 */
function setDayOfYear (dirtyDate, dirtyDayOfYear) {
  var date = parse(dirtyDate)
  var dayOfYear = Number(dirtyDayOfYear)
  date.setMonth(0)
  date.setDate(dayOfYear)
  return date
}

module.exports = setDayOfYear

},{"../parse/index.js":146}],150:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Hour Helpers
 * @summary Set the hours to the given date.
 *
 * @description
 * Set the hours to the given date.
 *
 * @param {Date|String|Number} date - the date to be changed
 * @param {Number} hours - the hours of the new date
 * @returns {Date} the new date with the hours setted
 *
 * @example
 * // Set 4 hours to 1 September 2014 11:30:00:
 * var result = setHours(new Date(2014, 8, 1, 11, 30), 4)
 * //=> Mon Sep 01 2014 04:30:00
 */
function setHours (dirtyDate, dirtyHours) {
  var date = parse(dirtyDate)
  var hours = Number(dirtyHours)
  date.setHours(hours)
  return date
}

module.exports = setHours

},{"../parse/index.js":146}],151:[function(require,module,exports){
var parse = require('../parse/index.js')
var addDays = require('../add_days/index.js')
var getISODay = require('../get_iso_day/index.js')

/**
 * @category Weekday Helpers
 * @summary Set the day of the ISO week to the given date.
 *
 * @description
 * Set the day of the ISO week to the given date.
 * ISO week starts with Monday.
 * 7 is the index of Sunday, 1 is the index of Monday etc.
 *
 * @param {Date|String|Number} date - the date to be changed
 * @param {Number} day - the day of the ISO week of the new date
 * @returns {Date} the new date with the day of the ISO week setted
 *
 * @example
 * // Set Sunday to 1 September 2014:
 * var result = setISODay(new Date(2014, 8, 1), 7)
 * //=> Sun Sep 07 2014 00:00:00
 */
function setISODay (dirtyDate, dirtyDay) {
  var date = parse(dirtyDate)
  var day = Number(dirtyDay)
  var currentDay = getISODay(date)
  var diff = day - currentDay
  return addDays(date, diff)
}

module.exports = setISODay

},{"../add_days/index.js":24,"../get_iso_day/index.js":80,"../parse/index.js":146}],152:[function(require,module,exports){
var parse = require('../parse/index.js')
var getISOWeek = require('../get_iso_week/index.js')

/**
 * @category ISO Week Helpers
 * @summary Set the ISO week to the given date.
 *
 * @description
 * Set the ISO week to the given date, saving the weekday number.
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * @param {Date|String|Number} date - the date to be changed
 * @param {Number} isoWeek - the ISO week of the new date
 * @returns {Date} the new date with the ISO week setted
 *
 * @example
 * // Set the 53rd ISO week to 7 August 2004:
 * var result = setISOWeek(new Date(2004, 7, 7), 53)
 * //=> Sat Jan 01 2005 00:00:00
 */
function setISOWeek (dirtyDate, dirtyISOWeek) {
  var date = parse(dirtyDate)
  var isoWeek = Number(dirtyISOWeek)
  var diff = getISOWeek(date) - isoWeek
  date.setDate(date.getDate() - diff * 7)
  return date
}

module.exports = setISOWeek

},{"../get_iso_week/index.js":81,"../parse/index.js":146}],153:[function(require,module,exports){
var parse = require('../parse/index.js')
var startOfISOYear = require('../start_of_iso_year/index.js')
var differenceInCalendarDays = require('../difference_in_calendar_days/index.js')

/**
 * @category ISO Week-Numbering Year Helpers
 * @summary Set the ISO week-numbering year to the given date.
 *
 * @description
 * Set the ISO week-numbering year to the given date,
 * saving the week number and the weekday number.
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * @param {Date|String|Number} date - the date to be changed
 * @param {Number} isoYear - the ISO week-numbering year of the new date
 * @returns {Date} the new date with the ISO week-numbering year setted
 *
 * @example
 * // Set ISO week-numbering year 2007 to 29 December 2008:
 * var result = setISOYear(new Date(2008, 11, 29), 2007)
 * //=> Mon Jan 01 2007 00:00:00
 */
function setISOYear (dirtyDate, dirtyISOYear) {
  var date = parse(dirtyDate)
  var isoYear = Number(dirtyISOYear)
  var diff = differenceInCalendarDays(date, startOfISOYear(date))
  var fourthOfJanuary = new Date(0)
  fourthOfJanuary.setFullYear(isoYear, 0, 4)
  fourthOfJanuary.setHours(0, 0, 0, 0)
  date = startOfISOYear(fourthOfJanuary)
  date.setDate(date.getDate() + diff)
  return date
}

module.exports = setISOYear

},{"../difference_in_calendar_days/index.js":39,"../parse/index.js":146,"../start_of_iso_year/index.js":163}],154:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Millisecond Helpers
 * @summary Set the milliseconds to the given date.
 *
 * @description
 * Set the milliseconds to the given date.
 *
 * @param {Date|String|Number} date - the date to be changed
 * @param {Number} milliseconds - the milliseconds of the new date
 * @returns {Date} the new date with the milliseconds setted
 *
 * @example
 * // Set 300 milliseconds to 1 September 2014 11:30:40.500:
 * var result = setMilliseconds(new Date(2014, 8, 1, 11, 30, 40, 500), 300)
 * //=> Mon Sep 01 2014 11:30:40.300
 */
function setMilliseconds (dirtyDate, dirtyMilliseconds) {
  var date = parse(dirtyDate)
  var milliseconds = Number(dirtyMilliseconds)
  date.setMilliseconds(milliseconds)
  return date
}

module.exports = setMilliseconds

},{"../parse/index.js":146}],155:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Minute Helpers
 * @summary Set the minutes to the given date.
 *
 * @description
 * Set the minutes to the given date.
 *
 * @param {Date|String|Number} date - the date to be changed
 * @param {Number} minutes - the minutes of the new date
 * @returns {Date} the new date with the minutes setted
 *
 * @example
 * // Set 45 minutes to 1 September 2014 11:30:40:
 * var result = setMinutes(new Date(2014, 8, 1, 11, 30, 40), 45)
 * //=> Mon Sep 01 2014 11:45:40
 */
function setMinutes (dirtyDate, dirtyMinutes) {
  var date = parse(dirtyDate)
  var minutes = Number(dirtyMinutes)
  date.setMinutes(minutes)
  return date
}

module.exports = setMinutes

},{"../parse/index.js":146}],156:[function(require,module,exports){
var parse = require('../parse/index.js')
var getDaysInMonth = require('../get_days_in_month/index.js')

/**
 * @category Month Helpers
 * @summary Set the month to the given date.
 *
 * @description
 * Set the month to the given date.
 *
 * @param {Date|String|Number} date - the date to be changed
 * @param {Number} month - the month of the new date
 * @returns {Date} the new date with the month setted
 *
 * @example
 * // Set February to 1 September 2014:
 * var result = setMonth(new Date(2014, 8, 1), 1)
 * //=> Sat Feb 01 2014 00:00:00
 */
function setMonth (dirtyDate, dirtyMonth) {
  var date = parse(dirtyDate)
  var month = Number(dirtyMonth)
  var year = date.getFullYear()
  var day = date.getDate()

  var dateWithDesiredMonth = new Date(0)
  dateWithDesiredMonth.setFullYear(year, month, 15)
  dateWithDesiredMonth.setHours(0, 0, 0, 0)
  var daysInMonth = getDaysInMonth(dateWithDesiredMonth)
  // Set the last day of the new month
  // if the original date was the last day of the longer month
  date.setMonth(month, Math.min(day, daysInMonth))
  return date
}

module.exports = setMonth

},{"../get_days_in_month/index.js":77,"../parse/index.js":146}],157:[function(require,module,exports){
var parse = require('../parse/index.js')
var setMonth = require('../set_month/index.js')

/**
 * @category Quarter Helpers
 * @summary Set the year quarter to the given date.
 *
 * @description
 * Set the year quarter to the given date.
 *
 * @param {Date|String|Number} date - the date to be changed
 * @param {Number} quarter - the quarter of the new date
 * @returns {Date} the new date with the quarter setted
 *
 * @example
 * // Set the 2nd quarter to 2 July 2014:
 * var result = setQuarter(new Date(2014, 6, 2), 2)
 * //=> Wed Apr 02 2014 00:00:00
 */
function setQuarter (dirtyDate, dirtyQuarter) {
  var date = parse(dirtyDate)
  var quarter = Number(dirtyQuarter)
  var oldQuarter = Math.floor(date.getMonth() / 3) + 1
  var diff = quarter - oldQuarter
  return setMonth(date, date.getMonth() + diff * 3)
}

module.exports = setQuarter

},{"../parse/index.js":146,"../set_month/index.js":156}],158:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Second Helpers
 * @summary Set the seconds to the given date.
 *
 * @description
 * Set the seconds to the given date.
 *
 * @param {Date|String|Number} date - the date to be changed
 * @param {Number} seconds - the seconds of the new date
 * @returns {Date} the new date with the seconds setted
 *
 * @example
 * // Set 45 seconds to 1 September 2014 11:30:40:
 * var result = setSeconds(new Date(2014, 8, 1, 11, 30, 40), 45)
 * //=> Mon Sep 01 2014 11:30:45
 */
function setSeconds (dirtyDate, dirtySeconds) {
  var date = parse(dirtyDate)
  var seconds = Number(dirtySeconds)
  date.setSeconds(seconds)
  return date
}

module.exports = setSeconds

},{"../parse/index.js":146}],159:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Year Helpers
 * @summary Set the year to the given date.
 *
 * @description
 * Set the year to the given date.
 *
 * @param {Date|String|Number} date - the date to be changed
 * @param {Number} year - the year of the new date
 * @returns {Date} the new date with the year setted
 *
 * @example
 * // Set year 2013 to 1 September 2014:
 * var result = setYear(new Date(2014, 8, 1), 2013)
 * //=> Sun Sep 01 2013 00:00:00
 */
function setYear (dirtyDate, dirtyYear) {
  var date = parse(dirtyDate)
  var year = Number(dirtyYear)
  date.setFullYear(year)
  return date
}

module.exports = setYear

},{"../parse/index.js":146}],160:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Day Helpers
 * @summary Return the start of a day for the given date.
 *
 * @description
 * Return the start of a day for the given date.
 * The result will be in the local timezone.
 *
 * @param {Date|String|Number} date - the original date
 * @returns {Date} the start of a day
 *
 * @example
 * // The start of a day for 2 September 2014 11:55:00:
 * var result = startOfDay(new Date(2014, 8, 2, 11, 55, 0))
 * //=> Tue Sep 02 2014 00:00:00
 */
function startOfDay (dirtyDate) {
  var date = parse(dirtyDate)
  date.setHours(0, 0, 0, 0)
  return date
}

module.exports = startOfDay

},{"../parse/index.js":146}],161:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Hour Helpers
 * @summary Return the start of an hour for the given date.
 *
 * @description
 * Return the start of an hour for the given date.
 * The result will be in the local timezone.
 *
 * @param {Date|String|Number} date - the original date
 * @returns {Date} the start of an hour
 *
 * @example
 * // The start of an hour for 2 September 2014 11:55:00:
 * var result = startOfHour(new Date(2014, 8, 2, 11, 55))
 * //=> Tue Sep 02 2014 11:00:00
 */
function startOfHour (dirtyDate) {
  var date = parse(dirtyDate)
  date.setMinutes(0, 0, 0)
  return date
}

module.exports = startOfHour

},{"../parse/index.js":146}],162:[function(require,module,exports){
var startOfWeek = require('../start_of_week/index.js')

/**
 * @category ISO Week Helpers
 * @summary Return the start of an ISO week for the given date.
 *
 * @description
 * Return the start of an ISO week for the given date.
 * The result will be in the local timezone.
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * @param {Date|String|Number} date - the original date
 * @returns {Date} the start of an ISO week
 *
 * @example
 * // The start of an ISO week for 2 September 2014 11:55:00:
 * var result = startOfISOWeek(new Date(2014, 8, 2, 11, 55, 0))
 * //=> Mon Sep 01 2014 00:00:00
 */
function startOfISOWeek (dirtyDate) {
  return startOfWeek(dirtyDate, {weekStartsOn: 1})
}

module.exports = startOfISOWeek

},{"../start_of_week/index.js":170}],163:[function(require,module,exports){
var getISOYear = require('../get_iso_year/index.js')
var startOfISOWeek = require('../start_of_iso_week/index.js')

/**
 * @category ISO Week-Numbering Year Helpers
 * @summary Return the start of an ISO week-numbering year for the given date.
 *
 * @description
 * Return the start of an ISO week-numbering year,
 * which always starts 3 days before the year's first Thursday.
 * The result will be in the local timezone.
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * @param {Date|String|Number} date - the original date
 * @returns {Date} the start of an ISO year
 *
 * @example
 * // The start of an ISO week-numbering year for 2 July 2005:
 * var result = startOfISOYear(new Date(2005, 6, 2))
 * //=> Mon Jan 03 2005 00:00:00
 */
function startOfISOYear (dirtyDate) {
  var year = getISOYear(dirtyDate)
  var fourthOfJanuary = new Date(0)
  fourthOfJanuary.setFullYear(year, 0, 4)
  fourthOfJanuary.setHours(0, 0, 0, 0)
  var date = startOfISOWeek(fourthOfJanuary)
  return date
}

module.exports = startOfISOYear

},{"../get_iso_year/index.js":83,"../start_of_iso_week/index.js":162}],164:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Minute Helpers
 * @summary Return the start of a minute for the given date.
 *
 * @description
 * Return the start of a minute for the given date.
 * The result will be in the local timezone.
 *
 * @param {Date|String|Number} date - the original date
 * @returns {Date} the start of a minute
 *
 * @example
 * // The start of a minute for 1 December 2014 22:15:45.400:
 * var result = startOfMinute(new Date(2014, 11, 1, 22, 15, 45, 400))
 * //=> Mon Dec 01 2014 22:15:00
 */
function startOfMinute (dirtyDate) {
  var date = parse(dirtyDate)
  date.setSeconds(0, 0)
  return date
}

module.exports = startOfMinute

},{"../parse/index.js":146}],165:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Month Helpers
 * @summary Return the start of a month for the given date.
 *
 * @description
 * Return the start of a month for the given date.
 * The result will be in the local timezone.
 *
 * @param {Date|String|Number} date - the original date
 * @returns {Date} the start of a month
 *
 * @example
 * // The start of a month for 2 September 2014 11:55:00:
 * var result = startOfMonth(new Date(2014, 8, 2, 11, 55, 0))
 * //=> Mon Sep 01 2014 00:00:00
 */
function startOfMonth (dirtyDate) {
  var date = parse(dirtyDate)
  date.setDate(1)
  date.setHours(0, 0, 0, 0)
  return date
}

module.exports = startOfMonth

},{"../parse/index.js":146}],166:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Quarter Helpers
 * @summary Return the start of a year quarter for the given date.
 *
 * @description
 * Return the start of a year quarter for the given date.
 * The result will be in the local timezone.
 *
 * @param {Date|String|Number} date - the original date
 * @returns {Date} the start of a quarter
 *
 * @example
 * // The start of a quarter for 2 September 2014 11:55:00:
 * var result = startOfQuarter(new Date(2014, 8, 2, 11, 55, 0))
 * //=> Tue Jul 01 2014 00:00:00
 */
function startOfQuarter (dirtyDate) {
  var date = parse(dirtyDate)
  var currentMonth = date.getMonth()
  var month = currentMonth - currentMonth % 3
  date.setMonth(month, 1)
  date.setHours(0, 0, 0, 0)
  return date
}

module.exports = startOfQuarter

},{"../parse/index.js":146}],167:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Second Helpers
 * @summary Return the start of a second for the given date.
 *
 * @description
 * Return the start of a second for the given date.
 * The result will be in the local timezone.
 *
 * @param {Date|String|Number} date - the original date
 * @returns {Date} the start of a second
 *
 * @example
 * // The start of a second for 1 December 2014 22:15:45.400:
 * var result = startOfSecond(new Date(2014, 11, 1, 22, 15, 45, 400))
 * //=> Mon Dec 01 2014 22:15:45.000
 */
function startOfSecond (dirtyDate) {
  var date = parse(dirtyDate)
  date.setMilliseconds(0)
  return date
}

module.exports = startOfSecond

},{"../parse/index.js":146}],168:[function(require,module,exports){
var startOfDay = require('../start_of_day/index.js')

/**
 * @category Day Helpers
 * @summary Return the start of today.
 *
 * @description
 * Return the start of today.
 *
 * @returns {Date} the start of today
 *
 * @example
 * // If today is 6 October 2014:
 * var result = startOfToday()
 * //=> Mon Oct 6 2014 00:00:00
 */
function startOfToday () {
  return startOfDay(new Date())
}

module.exports = startOfToday

},{"../start_of_day/index.js":160}],169:[function(require,module,exports){
/**
 * @category Day Helpers
 * @summary Return the start of tomorrow.
 *
 * @description
 * Return the start of tomorrow.
 *
 * @returns {Date} the start of tomorrow
 *
 * @example
 * // If today is 6 October 2014:
 * var result = startOfTomorrow()
 * //=> Tue Oct 7 2014 00:00:00
 */
function startOfTomorrow () {
  var now = new Date()
  var year = now.getFullYear()
  var month = now.getMonth()
  var day = now.getDate()

  var date = new Date(0)
  date.setFullYear(year, month, day + 1)
  date.setHours(0, 0, 0, 0)
  return date
}

module.exports = startOfTomorrow

},{}],170:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Week Helpers
 * @summary Return the start of a week for the given date.
 *
 * @description
 * Return the start of a week for the given date.
 * The result will be in the local timezone.
 *
 * @param {Date|String|Number} date - the original date
 * @param {Object} [options] - the object with options
 * @param {Number} [options.weekStartsOn=0] - the index of the first day of the week (0 - Sunday)
 * @returns {Date} the start of a week
 *
 * @example
 * // The start of a week for 2 September 2014 11:55:00:
 * var result = startOfWeek(new Date(2014, 8, 2, 11, 55, 0))
 * //=> Sun Aug 31 2014 00:00:00
 *
 * @example
 * // If the week starts on Monday, the start of the week for 2 September 2014 11:55:00:
 * var result = startOfWeek(new Date(2014, 8, 2, 11, 55, 0), {weekStartsOn: 1})
 * //=> Mon Sep 01 2014 00:00:00
 */
function startOfWeek (dirtyDate, dirtyOptions) {
  var weekStartsOn = dirtyOptions ? (Number(dirtyOptions.weekStartsOn) || 0) : 0

  var date = parse(dirtyDate)
  var day = date.getDay()
  var diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn

  date.setDate(date.getDate() - diff)
  date.setHours(0, 0, 0, 0)
  return date
}

module.exports = startOfWeek

},{"../parse/index.js":146}],171:[function(require,module,exports){
var parse = require('../parse/index.js')

/**
 * @category Year Helpers
 * @summary Return the start of a year for the given date.
 *
 * @description
 * Return the start of a year for the given date.
 * The result will be in the local timezone.
 *
 * @param {Date|String|Number} date - the original date
 * @returns {Date} the start of a year
 *
 * @example
 * // The start of a year for 2 September 2014 11:55:00:
 * var result = startOfYear(new Date(2014, 8, 2, 11, 55, 00))
 * //=> Wed Jan 01 2014 00:00:00
 */
function startOfYear (dirtyDate) {
  var cleanDate = parse(dirtyDate)
  var date = new Date(0)
  date.setFullYear(cleanDate.getFullYear(), 0, 1)
  date.setHours(0, 0, 0, 0)
  return date
}

module.exports = startOfYear

},{"../parse/index.js":146}],172:[function(require,module,exports){
/**
 * @category Day Helpers
 * @summary Return the start of yesterday.
 *
 * @description
 * Return the start of yesterday.
 *
 * @returns {Date} the start of yesterday
 *
 * @example
 * // If today is 6 October 2014:
 * var result = startOfYesterday()
 * //=> Sun Oct 5 2014 00:00:00
 */
function startOfYesterday () {
  var now = new Date()
  var year = now.getFullYear()
  var month = now.getMonth()
  var day = now.getDate()

  var date = new Date(0)
  date.setFullYear(year, month, day - 1)
  date.setHours(0, 0, 0, 0)
  return date
}

module.exports = startOfYesterday

},{}],173:[function(require,module,exports){
var addDays = require('../add_days/index.js')

/**
 * @category Day Helpers
 * @summary Subtract the specified number of days from the given date.
 *
 * @description
 * Subtract the specified number of days from the given date.
 *
 * @param {Date|String|Number} date - the date to be changed
 * @param {Number} amount - the amount of days to be subtracted
 * @returns {Date} the new date with the days subtracted
 *
 * @example
 * // Subtract 10 days from 1 September 2014:
 * var result = subDays(new Date(2014, 8, 1), 10)
 * //=> Fri Aug 22 2014 00:00:00
 */
function subDays (dirtyDate, dirtyAmount) {
  var amount = Number(dirtyAmount)
  return addDays(dirtyDate, -amount)
}

module.exports = subDays

},{"../add_days/index.js":24}],174:[function(require,module,exports){
var addHours = require('../add_hours/index.js')

/**
 * @category Hour Helpers
 * @summary Subtract the specified number of hours from the given date.
 *
 * @description
 * Subtract the specified number of hours from the given date.
 *
 * @param {Date|String|Number} date - the date to be changed
 * @param {Number} amount - the amount of hours to be subtracted
 * @returns {Date} the new date with the hours subtracted
 *
 * @example
 * // Subtract 2 hours from 11 July 2014 01:00:00:
 * var result = subHours(new Date(2014, 6, 11, 1, 0), 2)
 * //=> Thu Jul 10 2014 23:00:00
 */
function subHours (dirtyDate, dirtyAmount) {
  var amount = Number(dirtyAmount)
  return addHours(dirtyDate, -amount)
}

module.exports = subHours

},{"../add_hours/index.js":25}],175:[function(require,module,exports){
var addISOYears = require('../add_iso_years/index.js')

/**
 * @category ISO Week-Numbering Year Helpers
 * @summary Subtract the specified number of ISO week-numbering years from the given date.
 *
 * @description
 * Subtract the specified number of ISO week-numbering years from the given date.
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * @param {Date|String|Number} date - the date to be changed
 * @param {Number} amount - the amount of ISO week-numbering years to be subtracted
 * @returns {Date} the new date with the ISO week-numbering years subtracted
 *
 * @example
 * // Subtract 5 ISO week-numbering years from 1 September 2014:
 * var result = subISOYears(new Date(2014, 8, 1), 5)
 * //=> Mon Aug 31 2009 00:00:00
 */
function subISOYears (dirtyDate, dirtyAmount) {
  var amount = Number(dirtyAmount)
  return addISOYears(dirtyDate, -amount)
}

module.exports = subISOYears

},{"../add_iso_years/index.js":26}],176:[function(require,module,exports){
var addMilliseconds = require('../add_milliseconds/index.js')

/**
 * @category Millisecond Helpers
 * @summary Subtract the specified number of milliseconds from the given date.
 *
 * @description
 * Subtract the specified number of milliseconds from the given date.
 *
 * @param {Date|String|Number} date - the date to be changed
 * @param {Number} amount - the amount of milliseconds to be subtracted
 * @returns {Date} the new date with the milliseconds subtracted
 *
 * @example
 * // Subtract 750 milliseconds from 10 July 2014 12:45:30.000:
 * var result = subMilliseconds(new Date(2014, 6, 10, 12, 45, 30, 0), 750)
 * //=> Thu Jul 10 2014 12:45:29.250
 */
function subMilliseconds (dirtyDate, dirtyAmount) {
  var amount = Number(dirtyAmount)
  return addMilliseconds(dirtyDate, -amount)
}

module.exports = subMilliseconds

},{"../add_milliseconds/index.js":27}],177:[function(require,module,exports){
var addMinutes = require('../add_minutes/index.js')

/**
 * @category Minute Helpers
 * @summary Subtract the specified number of minutes from the given date.
 *
 * @description
 * Subtract the specified number of minutes from the given date.
 *
 * @param {Date|String|Number} date - the date to be changed
 * @param {Number} amount - the amount of minutes to be subtracted
 * @returns {Date} the new date with the mintues subtracted
 *
 * @example
 * // Subtract 30 minutes from 10 July 2014 12:00:00:
 * var result = subMinutes(new Date(2014, 6, 10, 12, 0), 30)
 * //=> Thu Jul 10 2014 11:30:00
 */
function subMinutes (dirtyDate, dirtyAmount) {
  var amount = Number(dirtyAmount)
  return addMinutes(dirtyDate, -amount)
}

module.exports = subMinutes

},{"../add_minutes/index.js":28}],178:[function(require,module,exports){
var addMonths = require('../add_months/index.js')

/**
 * @category Month Helpers
 * @summary Subtract the specified number of months from the given date.
 *
 * @description
 * Subtract the specified number of months from the given date.
 *
 * @param {Date|String|Number} date - the date to be changed
 * @param {Number} amount - the amount of months to be subtracted
 * @returns {Date} the new date with the months subtracted
 *
 * @example
 * // Subtract 5 months from 1 February 2015:
 * var result = subMonths(new Date(2015, 1, 1), 5)
 * //=> Mon Sep 01 2014 00:00:00
 */
function subMonths (dirtyDate, dirtyAmount) {
  var amount = Number(dirtyAmount)
  return addMonths(dirtyDate, -amount)
}

module.exports = subMonths

},{"../add_months/index.js":29}],179:[function(require,module,exports){
var addQuarters = require('../add_quarters/index.js')

/**
 * @category Quarter Helpers
 * @summary Subtract the specified number of year quarters from the given date.
 *
 * @description
 * Subtract the specified number of year quarters from the given date.
 *
 * @param {Date|String|Number} date - the date to be changed
 * @param {Number} amount - the amount of quarters to be subtracted
 * @returns {Date} the new date with the quarters subtracted
 *
 * @example
 * // Subtract 3 quarters from 1 September 2014:
 * var result = subQuarters(new Date(2014, 8, 1), 3)
 * //=> Sun Dec 01 2013 00:00:00
 */
function subQuarters (dirtyDate, dirtyAmount) {
  var amount = Number(dirtyAmount)
  return addQuarters(dirtyDate, -amount)
}

module.exports = subQuarters

},{"../add_quarters/index.js":30}],180:[function(require,module,exports){
var addSeconds = require('../add_seconds/index.js')

/**
 * @category Second Helpers
 * @summary Subtract the specified number of seconds from the given date.
 *
 * @description
 * Subtract the specified number of seconds from the given date.
 *
 * @param {Date|String|Number} date - the date to be changed
 * @param {Number} amount - the amount of seconds to be subtracted
 * @returns {Date} the new date with the seconds subtracted
 *
 * @example
 * // Subtract 30 seconds from 10 July 2014 12:45:00:
 * var result = subSeconds(new Date(2014, 6, 10, 12, 45, 0), 30)
 * //=> Thu Jul 10 2014 12:44:30
 */
function subSeconds (dirtyDate, dirtyAmount) {
  var amount = Number(dirtyAmount)
  return addSeconds(dirtyDate, -amount)
}

module.exports = subSeconds

},{"../add_seconds/index.js":31}],181:[function(require,module,exports){
var addWeeks = require('../add_weeks/index.js')

/**
 * @category Week Helpers
 * @summary Subtract the specified number of weeks from the given date.
 *
 * @description
 * Subtract the specified number of weeks from the given date.
 *
 * @param {Date|String|Number} date - the date to be changed
 * @param {Number} amount - the amount of weeks to be subtracted
 * @returns {Date} the new date with the weeks subtracted
 *
 * @example
 * // Subtract 4 weeks from 1 September 2014:
 * var result = subWeeks(new Date(2014, 8, 1), 4)
 * //=> Mon Aug 04 2014 00:00:00
 */
function subWeeks (dirtyDate, dirtyAmount) {
  var amount = Number(dirtyAmount)
  return addWeeks(dirtyDate, -amount)
}

module.exports = subWeeks

},{"../add_weeks/index.js":32}],182:[function(require,module,exports){
var addYears = require('../add_years/index.js')

/**
 * @category Year Helpers
 * @summary Subtract the specified number of years from the given date.
 *
 * @description
 * Subtract the specified number of years from the given date.
 *
 * @param {Date|String|Number} date - the date to be changed
 * @param {Number} amount - the amount of years to be subtracted
 * @returns {Date} the new date with the years subtracted
 *
 * @example
 * // Subtract 5 years from 1 September 2014:
 * var result = subYears(new Date(2014, 8, 1), 5)
 * //=> Tue Sep 01 2009 00:00:00
 */
function subYears (dirtyDate, dirtyAmount) {
  var amount = Number(dirtyAmount)
  return addYears(dirtyDate, -amount)
}

module.exports = subYears

},{"../add_years/index.js":33}],183:[function(require,module,exports){
'use strict';
module.exports = function (date) {
	return (date || new Date()).toISOString().replace(/T/, ' ').replace(/\..+/, ' UTC');
};

},{}],184:[function(require,module,exports){
'use strict';

var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

module.exports = function (str) {
	if (typeof str !== 'string') {
		throw new TypeError('Expected a string');
	}

	return str.replace(matchOperatorsRe, '\\$&');
};

},{}],185:[function(require,module,exports){
'use strict';
module.exports = (function () {
	if (process.argv.indexOf('--no-color') !== -1) {
		return false;
	}

	if (process.argv.indexOf('--color') !== -1) {
		return true;
	}

	if (process.stdout && !process.stdout.isTTY) {
		return false;
	}

	if (process.platform === 'win32') {
		return true;
	}

	if ('COLORTERM' in process.env) {
		return true;
	}

	if (process.env.TERM === 'dumb') {
		return false;
	}

	if (/^screen|^xterm|^vt100|color|ansi|cygwin|linux/i.test(process.env.TERM)) {
		return true;
	}

	return false;
})();

},{}],186:[function(require,module,exports){
'use strict';
module.exports = (flag, argv) => {
	argv = argv || process.argv;
	const prefix = flag.startsWith('-') ? '' : (flag.length === 1 ? '-' : '--');
	const pos = argv.indexOf(prefix + flag);
	const terminatorPos = argv.indexOf('--');
	return pos !== -1 && (terminatorPos === -1 ? true : pos < terminatorPos);
};

},{}],187:[function(require,module,exports){
'use strict';
/* eslint-disable yoda */
module.exports = x => {
	if (Number.isNaN(x)) {
		return false;
	}

	// code points are derived from:
	// http://www.unix.org/Public/UNIDATA/EastAsianWidth.txt
	if (
		x >= 0x1100 && (
			x <= 0x115f ||  // Hangul Jamo
			x === 0x2329 || // LEFT-POINTING ANGLE BRACKET
			x === 0x232a || // RIGHT-POINTING ANGLE BRACKET
			// CJK Radicals Supplement .. Enclosed CJK Letters and Months
			(0x2e80 <= x && x <= 0x3247 && x !== 0x303f) ||
			// Enclosed CJK Letters and Months .. CJK Unified Ideographs Extension A
			(0x3250 <= x && x <= 0x4dbf) ||
			// CJK Unified Ideographs .. Yi Radicals
			(0x4e00 <= x && x <= 0xa4c6) ||
			// Hangul Jamo Extended-A
			(0xa960 <= x && x <= 0xa97c) ||
			// Hangul Syllables
			(0xac00 <= x && x <= 0xd7a3) ||
			// CJK Compatibility Ideographs
			(0xf900 <= x && x <= 0xfaff) ||
			// Vertical Forms
			(0xfe10 <= x && x <= 0xfe19) ||
			// CJK Compatibility Forms .. Small Form Variants
			(0xfe30 <= x && x <= 0xfe6b) ||
			// Halfwidth and Fullwidth Forms
			(0xff01 <= x && x <= 0xff60) ||
			(0xffe0 <= x && x <= 0xffe6) ||
			// Kana Supplement
			(0x1b000 <= x && x <= 0x1b001) ||
			// Enclosed Ideographic Supplement
			(0x1f200 <= x && x <= 0x1f251) ||
			// CJK Unified Ideographs Extension B .. Tertiary Ideographic Plane
			(0x20000 <= x && x <= 0x3fffd)
		)
	) {
		return true;
	}

	return false;
};

},{}],188:[function(require,module,exports){
'use strict';
const ansiEscapes = require('ansi-escapes');
const cliCursor = require('cli-cursor');
const wrapAnsi = require('wrap-ansi');

const getWidth = stream => {
	const columns = stream.columns;

	if (!columns) {
		return 80;
	}

	// Windows appears to wrap a character early
	// I hate Windows so much
	if (process.platform === 'win32') {
		return columns - 1;
	}

	return columns;
};

const main = (stream, options) => {
	options = Object.assign({
		showCursor: false
	}, options);

	let prevLineCount = 0;

	const render = function () {
		if (!options.showCursor) {
			cliCursor.hide();
		}

		let out = [].join.call(arguments, ' ') + '\n';
		out = wrapAnsi(out, getWidth(stream), {
			trim: false,
			hard: true,
			wordWrap: false
		});
		stream.write(ansiEscapes.eraseLines(prevLineCount) + out);
		prevLineCount = out.split('\n').length;
	};

	render.clear = () => {
		stream.write(ansiEscapes.eraseLines(prevLineCount));
		prevLineCount = 0;
	};

	render.done = () => {
		prevLineCount = 0;

		if (!options.showCursor) {
			cliCursor.show();
		}
	};

	return render;
};

module.exports = main(process.stdout);
module.exports.stderr = main(process.stderr);
module.exports.create = main;

},{"ansi-escapes":14,"cli-cursor":19,"wrap-ansi":209}],189:[function(require,module,exports){
'use strict';
module.exports = (to, from) => {
	// TODO: use `Reflect.ownKeys()` when targeting Node.js 6
	for (const prop of Object.getOwnPropertyNames(from).concat(Object.getOwnPropertySymbols(from))) {
		Object.defineProperty(to, prop, Object.getOwnPropertyDescriptor(from, prop));
	}
};

},{}],190:[function(require,module,exports){
'use strict';
const mimicFn = require('mimic-fn');

module.exports = (fn, opts) => {
	// TODO: Remove this in v3
	if (opts === true) {
		throw new TypeError('The second argument is now an options object');
	}

	if (typeof fn !== 'function') {
		throw new TypeError('Expected a function');
	}

	opts = opts || {};

	let ret;
	let called = false;
	const fnName = fn.displayName || fn.name || '<anonymous>';

	const onetime = function () {
		if (called) {
			if (opts.throw === true) {
				throw new Error(`Function \`${fnName}\` can only be called once`);
			}

			return ret;
		}

		called = true;
		ret = fn.apply(this, arguments);
		fn = null;

		return ret;
	};

	mimicFn(onetime, fn);

	return onetime;
};

},{"mimic-fn":189}],191:[function(require,module,exports){
'use strict';
module.exports = function (ms) {
	if (typeof ms !== 'number') {
		throw new TypeError('Expected a number');
	}

	return {
		days: Math.floor(ms / 86400000),
		hours: Math.floor(ms / 3600000 % 24),
		minutes: Math.floor(ms / 60000 % 60),
		seconds: Math.floor(ms / 1000 % 60),
		milliseconds: Math.floor(ms % 1000)
	};
};

},{}],192:[function(require,module,exports){
'use strict';
var parseMs = require('parse-ms');

function add(ret, val, postfix) {
	if (val > 0) {
		ret.push(val + postfix);
	}

	return ret;
}

module.exports = function (ms, opts) {
	if (typeof ms !== 'number') {
		throw new TypeError('Expected a number');
	}

	if (ms < 1000) {
		return Math.ceil(ms) + 'ms';
	}

	opts = opts || {};

	var ret = [];
	var parsed = parseMs(ms);

	ret = add(ret, parsed.days, 'd');
	ret = add(ret, parsed.hours, 'h');
	ret = add(ret, parsed.minutes, 'm');

	if (opts.compact) {
		ret = add(ret, parsed.seconds, 's');
		return '~' + ret[0];
	}

	ret = add(ret, (ms / 1000 % 60).toFixed(1).replace(/\.0$/, ''), 's');

	return ret.join(' ');
};

},{"parse-ms":191}],193:[function(require,module,exports){
(function (__dirname){
/*
 * readlineSync
 * https://github.com/anseki/readline-sync
 *
 * Copyright (c) 2018 anseki
 * Licensed under the MIT license.
 */

'use strict';

var
  IS_WIN = process.platform === 'win32',

  ALGORITHM_CIPHER = 'aes-256-cbc',
  ALGORITHM_HASH = 'sha256',
  DEFAULT_ERR_MSG = 'The current environment doesn\'t support interactive reading from TTY.',

  fs = require('fs'),
  TTY = process.binding('tty_wrap').TTY,
  childProc = require('child_process'),
  pathUtil = require('path'),

  defaultOptions = {
    /* eslint-disable key-spacing */
    prompt:             '> ',
    hideEchoBack:       false,
    mask:               '*',
    limit:              [],
    limitMessage:       'Input another, please.$<( [)limit(])>',
    defaultInput:       '',
    trueValue:          [],
    falseValue:         [],
    caseSensitive:      false,
    keepWhitespace:     false,
    encoding:           'utf8',
    bufferSize:         1024,
    print:              void 0,
    history:            true,
    cd:                 false,
    phContent:          void 0,
    preCheck:           void 0
    /* eslint-enable key-spacing */
  },

  fdR = 'none', fdW, ttyR, isRawMode = false,
  extHostPath, extHostArgs, tempdir, salt = 0,
  lastInput = '', inputHistory = [], rawInput,
  _DBG_useExt = false, _DBG_checkOptions = false, _DBG_checkMethod = false;

function getHostArgs(options) {
  // Send any text to crazy Windows shell safely.
  function encodeArg(arg) {
    return arg.replace(/[^\w\u0080-\uFFFF]/g, function(chr) {
      return '#' + chr.charCodeAt(0) + ';';
    });
  }

  return extHostArgs.concat((function(conf) {
    var args = [];
    Object.keys(conf).forEach(function(optionName) {
      if (conf[optionName] === 'boolean') {
        if (options[optionName]) { args.push('--' + optionName); }
      } else if (conf[optionName] === 'string') {
        if (options[optionName]) {
          args.push('--' + optionName, encodeArg(options[optionName]));
        }
      }
    });
    return args;
  })({
    /* eslint-disable key-spacing */
    display:        'string',
    displayOnly:    'boolean',
    keyIn:          'boolean',
    hideEchoBack:   'boolean',
    mask:           'string',
    limit:          'string',
    caseSensitive:  'boolean'
    /* eslint-enable key-spacing */
  }));
}

// piping via files (for Node.js v0.10-)
function _execFileSync(options, execOptions) {

  function getTempfile(name) {
    var filepath, suffix = '', fd;
    tempdir = tempdir || require('os').tmpdir();

    while (true) {
      filepath = pathUtil.join(tempdir, name + suffix);
      try {
        fd = fs.openSync(filepath, 'wx');
      } catch (e) {
        if (e.code === 'EEXIST') {
          suffix++;
          continue;
        } else {
          throw e;
        }
      }
      fs.closeSync(fd);
      break;
    }
    return filepath;
  }

  var hostArgs, shellPath, shellArgs, res = {}, exitCode, extMessage,
    pathStdout = getTempfile('readline-sync.stdout'),
    pathStderr = getTempfile('readline-sync.stderr'),
    pathExit = getTempfile('readline-sync.exit'),
    pathDone = getTempfile('readline-sync.done'),
    crypto = require('crypto'), shasum, decipher, password;

  shasum = crypto.createHash(ALGORITHM_HASH);
  shasum.update('' + process.pid + (salt++) + Math.random());
  password = shasum.digest('hex');
  decipher = crypto.createDecipher(ALGORITHM_CIPHER, password);

  hostArgs = getHostArgs(options);
  if (IS_WIN) {
    shellPath = process.env.ComSpec || 'cmd.exe';
    process.env.Q = '"'; // The quote (") that isn't escaped.
    // `()` for ignore space by echo
    shellArgs = ['/V:ON', '/S', '/C',
      '(%Q%' + shellPath + '%Q% /V:ON /S /C %Q%' + /* ESLint bug? */ // eslint-disable-line no-path-concat
        '%Q%' + extHostPath + '%Q%' +
          hostArgs.map(function(arg) { return ' %Q%' + arg + '%Q%'; }).join('') +
        ' & (echo !ERRORLEVEL!)>%Q%' + pathExit + '%Q%%Q%) 2>%Q%' + pathStderr + '%Q%' +
      ' |%Q%' + process.execPath + '%Q% %Q%' + __dirname + '\\encrypt.js%Q%' +
        ' %Q%' + ALGORITHM_CIPHER + '%Q% %Q%' + password + '%Q%' +
        ' >%Q%' + pathStdout + '%Q%' +
      ' & (echo 1)>%Q%' + pathDone + '%Q%'];
  } else {
    shellPath = '/bin/sh';
    shellArgs = ['-c',
      // Use `()`, not `{}` for `-c` (text param)
      '("' + extHostPath + '"' + /* ESLint bug? */ // eslint-disable-line no-path-concat
          hostArgs.map(function(arg) { return " '" + arg.replace(/'/g, "'\\''") + "'"; }).join('') +
        '; echo $?>"' + pathExit + '") 2>"' + pathStderr + '"' +
      ' |"' + process.execPath + '" "' + __dirname + '/encrypt.js"' +
        ' "' + ALGORITHM_CIPHER + '" "' + password + '"' +
        ' >"' + pathStdout + '"' +
      '; echo 1 >"' + pathDone + '"'];
  }
  if (_DBG_checkMethod) { _DBG_checkMethod('_execFileSync', hostArgs); }
  try {
    childProc.spawn(shellPath, shellArgs, execOptions);
  } catch (e) {
    res.error = new Error(e.message);
    res.error.method = '_execFileSync - spawn';
    res.error.program = shellPath;
    res.error.args = shellArgs;
  }

  while (fs.readFileSync(pathDone, {encoding: options.encoding}).trim() !== '1') {} // eslint-disable-line no-empty
  if ((exitCode =
      fs.readFileSync(pathExit, {encoding: options.encoding}).trim()) === '0') {
    res.input =
      decipher.update(fs.readFileSync(pathStdout, {encoding: 'binary'}),
        'hex', options.encoding) +
      decipher.final(options.encoding);
  } else {
    extMessage = fs.readFileSync(pathStderr, {encoding: options.encoding}).trim();
    res.error = new Error(DEFAULT_ERR_MSG + (extMessage ? '\n' + extMessage : ''));
    res.error.method = '_execFileSync';
    res.error.program = shellPath;
    res.error.args = shellArgs;
    res.error.extMessage = extMessage;
    res.error.exitCode = +exitCode;
  }

  fs.unlinkSync(pathStdout);
  fs.unlinkSync(pathStderr);
  fs.unlinkSync(pathExit);
  fs.unlinkSync(pathDone);

  return res;
}

function readlineExt(options) {
  var hostArgs, res = {}, extMessage,
    execOptions = {env: process.env, encoding: options.encoding};

  if (!extHostPath) {
    if (IS_WIN) {
      if (process.env.PSModulePath) { // Windows PowerShell
        extHostPath = 'powershell.exe';
        extHostArgs = ['-ExecutionPolicy', 'Bypass', '-File', __dirname + '\\read.ps1']; // eslint-disable-line no-path-concat
      } else {                        // Windows Script Host
        extHostPath = 'cscript.exe';
        extHostArgs = ['//nologo', __dirname + '\\read.cs.js']; // eslint-disable-line no-path-concat
      }
    } else {
      extHostPath = '/bin/sh';
      extHostArgs = [__dirname + '/read.sh']; // eslint-disable-line no-path-concat
    }
  }
  if (IS_WIN && !process.env.PSModulePath) { // Windows Script Host
    // ScriptPW (Win XP and Server2003) needs TTY stream as STDIN.
    // In this case, If STDIN isn't TTY, an error is thrown.
    execOptions.stdio = [process.stdin];
  }

  if (childProc.execFileSync) {
    hostArgs = getHostArgs(options);
    if (_DBG_checkMethod) { _DBG_checkMethod('execFileSync', hostArgs); }
    try {
      res.input = childProc.execFileSync(extHostPath, hostArgs, execOptions);
    } catch (e) { // non-zero exit code
      extMessage = e.stderr ? (e.stderr + '').trim() : '';
      res.error = new Error(DEFAULT_ERR_MSG + (extMessage ? '\n' + extMessage : ''));
      res.error.method = 'execFileSync';
      res.error.program = extHostPath;
      res.error.args = hostArgs;
      res.error.extMessage = extMessage;
      res.error.exitCode = e.status;
      res.error.code = e.code;
      res.error.signal = e.signal;
    }
  } else {
    res = _execFileSync(options, execOptions);
  }
  if (!res.error) {
    res.input = res.input.replace(/^\s*'|'\s*$/g, '');
    options.display = '';
  }

  return res;
}

/*
  display:            string
  displayOnly:        boolean
  keyIn:              boolean
  hideEchoBack:       boolean
  mask:               string
  limit:              string (pattern)
  caseSensitive:      boolean
  keepWhitespace:     boolean
  encoding, bufferSize, print
*/
function _readlineSync(options) {
  var input = '', displaySave = options.display,
    silent = !options.display &&
      options.keyIn && options.hideEchoBack && !options.mask;

  function tryExt() {
    var res = readlineExt(options);
    if (res.error) { throw res.error; }
    return res.input;
  }

  if (_DBG_checkOptions) { _DBG_checkOptions(options); }

  (function() { // open TTY
    var fsB, constants, verNum;

    function getFsB() {
      if (!fsB) {
        fsB = process.binding('fs'); // For raw device path
        constants = process.binding('constants');
      }
      return fsB;
    }

    if (typeof fdR !== 'string') { return; }
    fdR = null;

    if (IS_WIN) {
      // iojs-v2.3.2+ input stream can't read first line. (#18)
      // ** Don't get process.stdin before check! **
      // Fixed v5.1.0
      // Fixed v4.2.4
      // It regressed again in v5.6.0, it is fixed in v6.2.0.
      verNum = (function(ver) { // getVerNum
        var nums = ver.replace(/^\D+/, '').split('.');
        var verNum = 0;
        if ((nums[0] = +nums[0])) { verNum += nums[0] * 10000; }
        if ((nums[1] = +nums[1])) { verNum += nums[1] * 100; }
        if ((nums[2] = +nums[2])) { verNum += nums[2]; }
        return verNum;
      })(process.version);
      if (!(verNum >= 20302 && verNum < 40204 || verNum >= 50000 && verNum < 50100 || verNum >= 50600 && verNum < 60200) &&
          process.stdin.isTTY) {
        process.stdin.pause();
        fdR = process.stdin.fd;
        ttyR = process.stdin._handle;
      } else {
        try {
          // The stream by fs.openSync('\\\\.\\CON', 'r') can't switch to raw mode.
          // 'CONIN$' might fail on XP, 2000, 7 (x86).
          fdR = getFsB().open('CONIN$', constants.O_RDWR, parseInt('0666', 8));
          ttyR = new TTY(fdR, true);
        } catch (e) { /* ignore */ }
      }

      if (process.stdout.isTTY) {
        fdW = process.stdout.fd;
      } else {
        try {
          fdW = fs.openSync('\\\\.\\CON', 'w');
        } catch (e) { /* ignore */ }
        if (typeof fdW !== 'number') { // Retry
          try {
            fdW = getFsB().open('CONOUT$', constants.O_RDWR, parseInt('0666', 8));
          } catch (e) { /* ignore */ }
        }
      }

    } else {
      if (process.stdin.isTTY) {
        process.stdin.pause();
        try {
          fdR = fs.openSync('/dev/tty', 'r'); // device file, not process.stdin
          ttyR = process.stdin._handle;
        } catch (e) { /* ignore */ }
      } else {
        // Node.js v0.12 read() fails.
        try {
          fdR = fs.openSync('/dev/tty', 'r');
          ttyR = new TTY(fdR, false);
        } catch (e) { /* ignore */ }
      }

      if (process.stdout.isTTY) {
        fdW = process.stdout.fd;
      } else {
        try {
          fdW = fs.openSync('/dev/tty', 'w');
        } catch (e) { /* ignore */ }
      }
    }
  })();

  (function() { // try read
    var atEol, limit,
      isCooked = !options.hideEchoBack && !options.keyIn,
      buffer, reqSize, readSize, chunk, line;
    rawInput = '';

    // Node.js v0.10- returns an error if same mode is set.
    function setRawMode(mode) {
      if (mode === isRawMode) { return true; }
      if (ttyR.setRawMode(mode) !== 0) { return false; }
      isRawMode = mode;
      return true;
    }

    if (_DBG_useExt || !ttyR ||
        typeof fdW !== 'number' && (options.display || !isCooked)) {
      input = tryExt();
      return;
    }

    if (options.display) {
      fs.writeSync(fdW, options.display);
      options.display = '';
    }
    if (options.displayOnly) { return; }

    if (!setRawMode(!isCooked)) {
      input = tryExt();
      return;
    }

    reqSize = options.keyIn ? 1 : options.bufferSize;
    // Check `allocUnsafe` to make sure of the new API.
    buffer = Buffer.allocUnsafe && Buffer.alloc ? Buffer.alloc(reqSize) : new Buffer(reqSize);

    if (options.keyIn && options.limit) {
      limit = new RegExp('[^' + options.limit + ']',
        'g' + (options.caseSensitive ? '' : 'i'));
    }

    while (true) {
      readSize = 0;
      try {
        readSize = fs.readSync(fdR, buffer, 0, reqSize);
      } catch (e) {
        if (e.code !== 'EOF') {
          setRawMode(false);
          input += tryExt();
          return;
        }
      }
      if (readSize > 0) {
        chunk = buffer.toString(options.encoding, 0, readSize);
        rawInput += chunk;
      } else {
        chunk = '\n';
        rawInput += String.fromCharCode(0);
      }

      if (chunk && typeof (line = (chunk.match(/^(.*?)[\r\n]/) || [])[1]) === 'string') {
        chunk = line;
        atEol = true;
      }

      // other ctrl-chars
      // eslint-disable-next-line no-control-regex
      if (chunk) { chunk = chunk.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, ''); }
      if (chunk && limit) { chunk = chunk.replace(limit, ''); }

      if (chunk) {
        if (!isCooked) {
          if (!options.hideEchoBack) {
            fs.writeSync(fdW, chunk);
          } else if (options.mask) {
            fs.writeSync(fdW, (new Array(chunk.length + 1)).join(options.mask));
          }
        }
        input += chunk;
      }

      if (!options.keyIn && atEol ||
        options.keyIn && input.length >= reqSize) { break; }
    }

    if (!isCooked && !silent) { fs.writeSync(fdW, '\n'); }
    setRawMode(false);
  })();

  if (options.print && !silent) {
    options.print(displaySave + (options.displayOnly ? '' :
        (options.hideEchoBack ? (new Array(input.length + 1)).join(options.mask)
          : input) + '\n'), // must at least write '\n'
      options.encoding);
  }

  return options.displayOnly ? '' :
    (lastInput = options.keepWhitespace || options.keyIn ? input : input.trim());
}

function flattenArray(array, validator) {
  var flatArray = [];
  function _flattenArray(array) {
    if (array == null) {
      return;
    } else if (Array.isArray(array)) {
      array.forEach(_flattenArray);
    } else if (!validator || validator(array)) {
      flatArray.push(array);
    }
  }
  _flattenArray(array);
  return flatArray;
}

function escapePattern(pattern) {
  return pattern.replace(/[\x00-\x7f]/g, // eslint-disable-line no-control-regex
    function(s) { return '\\x' + ('00' + s.charCodeAt().toString(16)).substr(-2); });
}

// margeOptions(options1, options2 ... )
// margeOptions(true, options1, options2 ... )
//    arg1=true : Start from defaultOptions and pick elements of that.
function margeOptions() {
  var optionsList = Array.prototype.slice.call(arguments),
    optionNames, fromDefault;

  if (optionsList.length && typeof optionsList[0] === 'boolean') {
    fromDefault = optionsList.shift();
    if (fromDefault) {
      optionNames = Object.keys(defaultOptions);
      optionsList.unshift(defaultOptions);
    }
  }

  return optionsList.reduce(function(options, optionsPart) {
    if (optionsPart == null) { return options; }

    // ======== DEPRECATED ========
    if (optionsPart.hasOwnProperty('noEchoBack') &&
        !optionsPart.hasOwnProperty('hideEchoBack')) {
      optionsPart.hideEchoBack = optionsPart.noEchoBack;
      delete optionsPart.noEchoBack;
    }
    if (optionsPart.hasOwnProperty('noTrim') &&
        !optionsPart.hasOwnProperty('keepWhitespace')) {
      optionsPart.keepWhitespace = optionsPart.noTrim;
      delete optionsPart.noTrim;
    }
    // ======== /DEPRECATED ========

    if (!fromDefault) { optionNames = Object.keys(optionsPart); }
    optionNames.forEach(function(optionName) {
      var value;
      if (!optionsPart.hasOwnProperty(optionName)) { return; }
      value = optionsPart[optionName];
      switch (optionName) {
                           // _readlineSync <- *    * -> defaultOptions
        // ================ string
        case 'mask':                        // *    *
        case 'limitMessage':                //      *
        case 'defaultInput':                //      *
        case 'encoding':                    // *    *
          value = value != null ? value + '' : '';
          if (value && optionName !== 'limitMessage') { value = value.replace(/[\r\n]/g, ''); }
          options[optionName] = value;
          break;
        // ================ number(int)
        case 'bufferSize':                  // *    *
          if (!isNaN(value = parseInt(value, 10)) && typeof value === 'number') {
            options[optionName] = value; // limited updating (number is needed)
          }
          break;
        // ================ boolean
        case 'displayOnly':                 // *
        case 'keyIn':                       // *
        case 'hideEchoBack':                // *    *
        case 'caseSensitive':               // *    *
        case 'keepWhitespace':              // *    *
        case 'history':                     //      *
        case 'cd':                          //      *
          options[optionName] = !!value;
          break;
        // ================ array
        case 'limit':                       // *    *     to string for readlineExt
        case 'trueValue':                   //      *
        case 'falseValue':                  //      *
          options[optionName] = flattenArray(value, function(value) {
            var type = typeof value;
            return type === 'string' || type === 'number' ||
              type === 'function' || value instanceof RegExp;
          }).map(function(value) {
            return typeof value === 'string' ? value.replace(/[\r\n]/g, '') : value;
          });
          break;
        // ================ function
        case 'print':                       // *    *
        case 'phContent':                   //      *
        case 'preCheck':                    //      *
          options[optionName] = typeof value === 'function' ? value : void 0;
          break;
        // ================ other
        case 'prompt':                      //      *
        case 'display':                     // *
          options[optionName] = value != null ? value : '';
          break;
        // no default
      }
    });
    return options;
  }, {});
}

function isMatched(res, comps, caseSensitive) {
  return comps.some(function(comp) {
    var type = typeof comp;
    return type === 'string' ?
        (caseSensitive ? res === comp : res.toLowerCase() === comp.toLowerCase()) :
      type === 'number' ? parseFloat(res) === comp :
      type === 'function' ? comp(res) :
      comp instanceof RegExp ? comp.test(res) : false;
  });
}

function replaceHomePath(path, expand) {
  var homePath = pathUtil.normalize(
    IS_WIN ? (process.env.HOMEDRIVE || '') + (process.env.HOMEPATH || '') :
    process.env.HOME || '').replace(/[\/\\]+$/, '');
  path = pathUtil.normalize(path);
  return expand ? path.replace(/^~(?=\/|\\|$)/, homePath) :
    path.replace(new RegExp('^' + escapePattern(homePath) +
      '(?=\\/|\\\\|$)', IS_WIN ? 'i' : ''), '~');
}

function replacePlaceholder(text, generator) {
  var PTN_INNER = '(?:\\(([\\s\\S]*?)\\))?(\\w+|.-.)(?:\\(([\\s\\S]*?)\\))?',
    rePlaceholder = new RegExp('(\\$)?(\\$<' + PTN_INNER + '>)', 'g'),
    rePlaceholderCompat = new RegExp('(\\$)?(\\$\\{' + PTN_INNER + '\\})', 'g');

  function getPlaceholderText(s, escape, placeholder, pre, param, post) {
    var text;
    return escape || typeof (text = generator(param)) !== 'string' ? placeholder :
      text ? (pre || '') + text + (post || '') : '';
  }

  return text.replace(rePlaceholder, getPlaceholderText)
    .replace(rePlaceholderCompat, getPlaceholderText);
}

function array2charlist(array, caseSensitive, collectSymbols) {
  var values, group = [], groupClass = -1, charCode = 0, symbols = '', suppressed;
  function addGroup(groups, group) {
    if (group.length > 3) { // ellipsis
      groups.push(group[0] + '...' + group[group.length - 1]);
      suppressed = true;
    } else if (group.length) {
      groups = groups.concat(group);
    }
    return groups;
  }

  values = array.reduce(
      function(chars, value) { return chars.concat((value + '').split('')); }, [])
    .reduce(function(groups, curChar) {
      var curGroupClass, curCharCode;
      if (!caseSensitive) { curChar = curChar.toLowerCase(); }
      curGroupClass = /^\d$/.test(curChar) ? 1 :
        /^[A-Z]$/.test(curChar) ? 2 : /^[a-z]$/.test(curChar) ? 3 : 0;
      if (collectSymbols && curGroupClass === 0) {
        symbols += curChar;
      } else {
        curCharCode = curChar.charCodeAt(0);
        if (curGroupClass && curGroupClass === groupClass &&
            curCharCode === charCode + 1) {
          group.push(curChar);
        } else {
          groups = addGroup(groups, group);
          group = [curChar];
          groupClass = curGroupClass;
        }
        charCode = curCharCode;
      }
      return groups;
    }, []);
  values = addGroup(values, group); // last group
  if (symbols) { values.push(symbols); suppressed = true; }
  return {values: values, suppressed: suppressed};
}

function joinChunks(chunks, suppressed) {
  return chunks.join(chunks.length > 2 ? ', ' : suppressed ? ' / ' : '/');
}

function getPhContent(param, options) {
  var text, values, resCharlist = {}, arg;
  if (options.phContent) {
    text = options.phContent(param, options);
  }
  if (typeof text !== 'string') {
    switch (param) {
      case 'hideEchoBack':
      case 'mask':
      case 'defaultInput':
      case 'caseSensitive':
      case 'keepWhitespace':
      case 'encoding':
      case 'bufferSize':
      case 'history':
      case 'cd':
        text = !options.hasOwnProperty(param) ? '' :
          typeof options[param] === 'boolean' ? (options[param] ? 'on' : 'off') :
          options[param] + '';
        break;
      // case 'prompt':
      // case 'query':
      // case 'display':
      //   text = options.hasOwnProperty('displaySrc') ? options.displaySrc + '' : '';
      //   break;
      case 'limit':
      case 'trueValue':
      case 'falseValue':
        values = options[options.hasOwnProperty(param + 'Src') ? param + 'Src' : param];
        if (options.keyIn) { // suppress
          resCharlist = array2charlist(values, options.caseSensitive);
          values = resCharlist.values;
        } else {
          values = values.filter(function(value) {
            var type = typeof value;
            return type === 'string' || type === 'number';
          });
        }
        text = joinChunks(values, resCharlist.suppressed);
        break;
      case 'limitCount':
      case 'limitCountNotZero':
        text = options[options.hasOwnProperty('limitSrc') ?
          'limitSrc' : 'limit'].length;
        text = text || param !== 'limitCountNotZero' ? text + '' : '';
        break;
      case 'lastInput':
        text = lastInput;
        break;
      case 'cwd':
      case 'CWD':
      case 'cwdHome':
        text = process.cwd();
        if (param === 'CWD') {
          text = pathUtil.basename(text);
        } else if (param === 'cwdHome') {
          text = replaceHomePath(text);
        }
        break;
      case 'date':
      case 'time':
      case 'localeDate':
      case 'localeTime':
        text = (new Date())['to' +
          param.replace(/^./, function(str) { return str.toUpperCase(); }) +
          'String']();
        break;
      default: // with arg
        if (typeof (arg = (param.match(/^history_m(\d+)$/) || [])[1]) === 'string') {
          text = inputHistory[inputHistory.length - arg] || '';
        }
    }
  }
  return text;
}

function getPhCharlist(param) {
  var matches = /^(.)-(.)$/.exec(param), text = '', from, to, code, step;
  if (!matches) { return null; }
  from = matches[1].charCodeAt(0);
  to = matches[2].charCodeAt(0);
  step = from < to ? 1 : -1;
  for (code = from; code !== to + step; code += step) { text += String.fromCharCode(code); }
  return text;
}

// cmd "arg" " a r g " "" 'a"r"g' "a""rg" "arg
function parseCl(cl) {
  var reToken = new RegExp(/(\s*)(?:("|')(.*?)(?:\2|$)|(\S+))/g), matches,
    taken = '', args = [], part;
  cl = cl.trim();
  while ((matches = reToken.exec(cl))) {
    part = matches[3] || matches[4] || '';
    if (matches[1]) {
      args.push(taken);
      taken = '';
    }
    taken += part;
  }
  if (taken) { args.push(taken); }
  return args;
}

function toBool(res, options) {
  return (
    (options.trueValue.length &&
      isMatched(res, options.trueValue, options.caseSensitive)) ? true :
    (options.falseValue.length &&
      isMatched(res, options.falseValue, options.caseSensitive)) ? false : res);
}

function getValidLine(options) {
  var res, forceNext, limitMessage,
    matches, histInput, args, resCheck;

  function _getPhContent(param) { return getPhContent(param, options); }
  function addDisplay(text) { options.display += (/[^\r\n]$/.test(options.display) ? '\n' : '') + text; }

  options.limitSrc = options.limit;
  options.displaySrc = options.display;
  options.limit = ''; // for readlineExt
  options.display = replacePlaceholder(options.display + '', _getPhContent);

  while (true) {
    res = _readlineSync(options);
    forceNext = false;
    limitMessage = '';

    if (options.defaultInput && !res) { res = options.defaultInput; }

    if (options.history) {
      if ((matches = /^\s*\!(?:\!|-1)(:p)?\s*$/.exec(res))) { // `!!` `!-1` +`:p`
        histInput = inputHistory[0] || '';
        if (matches[1]) { // only display
          forceNext = true;
        } else { // replace input
          res = histInput;
        }
        // Show it even if it is empty (NL only).
        addDisplay(histInput + '\n');
        if (!forceNext) { // Loop may break
          options.displayOnly = true;
          _readlineSync(options);
          options.displayOnly = false;
        }
      } else if (res && res !== inputHistory[inputHistory.length - 1]) {
        inputHistory = [res];
      }
    }

    if (!forceNext && options.cd && res) {
      args = parseCl(res);
      switch (args[0].toLowerCase()) {
        case 'cd':
          if (args[1]) {
            try {
              process.chdir(replaceHomePath(args[1], true));
            } catch (e) {
              addDisplay(e + '');
            }
          }
          forceNext = true;
          break;
        case 'pwd':
          addDisplay(process.cwd());
          forceNext = true;
          break;
        // no default
      }
    }

    if (!forceNext && options.preCheck) {
      resCheck = options.preCheck(res, options);
      res = resCheck.res;
      if (resCheck.forceNext) { forceNext = true; } // Don't switch to false.
    }

    if (!forceNext) {
      if (!options.limitSrc.length ||
        isMatched(res, options.limitSrc, options.caseSensitive)) { break; }
      if (options.limitMessage) {
        limitMessage = replacePlaceholder(options.limitMessage, _getPhContent);
      }
    }

    addDisplay((limitMessage ? limitMessage + '\n' : '') +
      replacePlaceholder(options.displaySrc + '', _getPhContent));
  }
  return toBool(res, options);
}

// for dev
exports._DBG_set_useExt = function(val) { _DBG_useExt = val; };
exports._DBG_set_checkOptions = function(val) { _DBG_checkOptions = val; };
exports._DBG_set_checkMethod = function(val) { _DBG_checkMethod = val; };
exports._DBG_clearHistory = function() { lastInput = ''; inputHistory = []; };

// ------------------------------------

exports.setDefaultOptions = function(options) {
  defaultOptions = margeOptions(true, options);
  return margeOptions(true); // copy
};

exports.question = function(query, options) {
  /* eslint-disable key-spacing */
  return getValidLine(margeOptions(margeOptions(true, options), {
    display:            query
  }));
  /* eslint-enable key-spacing */
};

exports.prompt = function(options) {
  var readOptions = margeOptions(true, options);
  readOptions.display = readOptions.prompt;
  return getValidLine(readOptions);
};

exports.keyIn = function(query, options) {
  /* eslint-disable key-spacing */
  var readOptions = margeOptions(margeOptions(true, options), {
    display:            query,
    keyIn:              true,
    keepWhitespace:     true
  });
  /* eslint-enable key-spacing */

  // char list
  readOptions.limitSrc = readOptions.limit.filter(function(value) {
    var type = typeof value;
    return type === 'string' || type === 'number';
  })
  .map(function(text) { return replacePlaceholder(text + '', getPhCharlist); });
  // pattern
  readOptions.limit = escapePattern(readOptions.limitSrc.join(''));

  ['trueValue', 'falseValue'].forEach(function(optionName) {
    readOptions[optionName] = readOptions[optionName].reduce(function(comps, comp) {
      var type = typeof comp;
      if (type === 'string' || type === 'number') {
        comps = comps.concat((comp + '').split(''));
      } else { comps.push(comp); }
      return comps;
    }, []);
  });

  readOptions.display = replacePlaceholder(readOptions.display + '',
    function(param) { return getPhContent(param, readOptions); });

  return toBool(_readlineSync(readOptions), readOptions);
};

// ------------------------------------

exports.questionEMail = function(query, options) {
  if (query == null) { query = 'Input e-mail address: '; }
  /* eslint-disable key-spacing */
  return exports.question(query, margeOptions({
    // -------- default
    hideEchoBack:       false,
    // http://www.w3.org/TR/html5/forms.html#valid-e-mail-address
    limit:              /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    limitMessage:       'Input valid e-mail address, please.',
    trueValue:          null,
    falseValue:         null
  }, options, {
    // -------- forced
    keepWhitespace:     false,
    cd:                 false
  }));
  /* eslint-enable key-spacing */
};

exports.questionNewPassword = function(query, options) {
  /* eslint-disable key-spacing */
  var resCharlist, min, max,
    readOptions = margeOptions({
      // -------- default
      hideEchoBack:       true,
      mask:               '*',
      limitMessage:       'It can include: $<charlist>\n' +
                            'And the length must be: $<length>',
      trueValue:          null,
      falseValue:         null,
      caseSensitive:      true
    }, options, {
      // -------- forced
      history:            false,
      cd:                 false,
      // limit (by charlist etc.),
      phContent: function(param) {
        return param === 'charlist' ? resCharlist.text :
          param === 'length' ? min + '...' + max : null;
      }
    }),
    // added:     charlist, min, max, confirmMessage, unmatchMessage
    charlist, confirmMessage, unmatchMessage,
    limit, limitMessage, res1, res2;
  /* eslint-enable key-spacing */
  options = options || {};

  charlist = replacePlaceholder(
    options.charlist ? options.charlist + '' : '$<!-~>', getPhCharlist);
  if (isNaN(min = parseInt(options.min, 10)) || typeof min !== 'number') { min = 12; }
  if (isNaN(max = parseInt(options.max, 10)) || typeof max !== 'number') { max = 24; }
  limit = new RegExp('^[' + escapePattern(charlist) +
    ']{' + min + ',' + max + '}$');
  resCharlist = array2charlist([charlist], readOptions.caseSensitive, true);
  resCharlist.text = joinChunks(resCharlist.values, resCharlist.suppressed);

  confirmMessage = options.confirmMessage != null ? options.confirmMessage :
    'Reinput a same one to confirm it: ';
  unmatchMessage = options.unmatchMessage != null ? options.unmatchMessage :
    'It differs from first one.' +
      ' Hit only the Enter key if you want to retry from first one.';

  if (query == null) { query = 'Input new password: '; }

  limitMessage = readOptions.limitMessage;
  while (!res2) {
    readOptions.limit = limit;
    readOptions.limitMessage = limitMessage;
    res1 = exports.question(query, readOptions);

    readOptions.limit = [res1, ''];
    readOptions.limitMessage = unmatchMessage;
    res2 = exports.question(confirmMessage, readOptions);
  }

  return res1;
};

function _questionNum(query, options, parser) {
  var validValue;
  function getValidValue(value) {
    validValue = parser(value);
    return !isNaN(validValue) && typeof validValue === 'number';
  }
  /* eslint-disable key-spacing */
  exports.question(query, margeOptions({
    // -------- default
    limitMessage:       'Input valid number, please.'
  }, options, {
    // -------- forced
    limit:              getValidValue,
    cd:                 false
    // trueValue, falseValue, caseSensitive, keepWhitespace don't work.
  }));
  /* eslint-enable key-spacing */
  return validValue;
}
exports.questionInt = function(query, options) {
  return _questionNum(query, options, function(value) { return parseInt(value, 10); });
};
exports.questionFloat = function(query, options) {
  return _questionNum(query, options, parseFloat);
};

exports.questionPath = function(query, options) {
  /* eslint-disable key-spacing */
  var validPath, error = '',
    readOptions = margeOptions({
      // -------- default
      hideEchoBack:       false,
      limitMessage:       '$<error(\n)>Input valid path, please.' +
                            '$<( Min:)min>$<( Max:)max>',
      history:            true,
      cd:                 true
    }, options, {
      // -------- forced
      keepWhitespace:     false,
      limit: function(value) {
        var exists, stat, res;
        value = replaceHomePath(value, true);
        error = ''; // for validate
        // mkdir -p
        function mkdirParents(dirPath) {
          dirPath.split(/\/|\\/).reduce(function(parents, dir) {
            var path = pathUtil.resolve((parents += dir + pathUtil.sep));
            if (!fs.existsSync(path)) {
              fs.mkdirSync(path);
            } else if (!fs.statSync(path).isDirectory()) {
              throw new Error('Non directory already exists: ' + path);
            }
            return parents;
          }, '');
        }

        try {
          exists = fs.existsSync(value);
          validPath = exists ? fs.realpathSync(value) : pathUtil.resolve(value);
          // options.exists default: true, not-bool: no-check
          if (!options.hasOwnProperty('exists') && !exists ||
              typeof options.exists === 'boolean' && options.exists !== exists) {
            error = (exists ? 'Already exists' : 'No such file or directory') +
              ': ' + validPath;
            return false;
          }
          if (!exists && options.create) {
            if (options.isDirectory) {
              mkdirParents(validPath);
            } else {
              mkdirParents(pathUtil.dirname(validPath));
              fs.closeSync(fs.openSync(validPath, 'w')); // touch
            }
            validPath = fs.realpathSync(validPath);
          }
          if (exists && (options.min || options.max ||
              options.isFile || options.isDirectory)) {
            stat = fs.statSync(validPath);
            // type check first (directory has zero size)
            if (options.isFile && !stat.isFile()) {
              error = 'Not file: ' + validPath;
              return false;
            } else if (options.isDirectory && !stat.isDirectory()) {
              error = 'Not directory: ' + validPath;
              return false;
            } else if (options.min && stat.size < +options.min ||
                options.max && stat.size > +options.max) {
              error = 'Size ' + stat.size + ' is out of range: ' + validPath;
              return false;
            }
          }
          if (typeof options.validate === 'function' &&
              (res = options.validate(validPath)) !== true) {
            if (typeof res === 'string') { error = res; }
            return false;
          }
        } catch (e) {
          error = e + '';
          return false;
        }
        return true;
      },
      // trueValue, falseValue, caseSensitive don't work.
      phContent: function(param) {
        return param === 'error' ? error :
          param !== 'min' && param !== 'max' ? null :
          options.hasOwnProperty(param) ? options[param] + '' : '';
      }
    });
    // added:     exists, create, min, max, isFile, isDirectory, validate
  /* eslint-enable key-spacing */
  options = options || {};

  if (query == null) { query = 'Input path (you can "cd" and "pwd"): '; }

  exports.question(query, readOptions);
  return validPath;
};

// props: preCheck, args, hRes, limit
function getClHandler(commandHandler, options) {
  var clHandler = {}, hIndex = {};
  if (typeof commandHandler === 'object') {
    Object.keys(commandHandler).forEach(function(cmd) {
      if (typeof commandHandler[cmd] === 'function') {
        hIndex[options.caseSensitive ? cmd : cmd.toLowerCase()] = commandHandler[cmd];
      }
    });
    clHandler.preCheck = function(res) {
      var cmdKey;
      clHandler.args = parseCl(res);
      cmdKey = clHandler.args[0] || '';
      if (!options.caseSensitive) { cmdKey = cmdKey.toLowerCase(); }
      clHandler.hRes =
        cmdKey !== '_' && hIndex.hasOwnProperty(cmdKey) ?
          hIndex[cmdKey].apply(res, clHandler.args.slice(1)) :
        hIndex.hasOwnProperty('_') ? hIndex._.apply(res, clHandler.args) : null;
      return {res: res, forceNext: false};
    };
    if (!hIndex.hasOwnProperty('_')) {
      clHandler.limit = function() { // It's called after preCheck.
        var cmdKey = clHandler.args[0] || '';
        if (!options.caseSensitive) { cmdKey = cmdKey.toLowerCase(); }
        return hIndex.hasOwnProperty(cmdKey);
      };
    }
  } else {
    clHandler.preCheck = function(res) {
      clHandler.args = parseCl(res);
      clHandler.hRes = typeof commandHandler === 'function' ?
        commandHandler.apply(res, clHandler.args) : true; // true for break loop
      return {res: res, forceNext: false};
    };
  }
  return clHandler;
}

exports.promptCL = function(commandHandler, options) {
  /* eslint-disable key-spacing */
  var readOptions = margeOptions({
      // -------- default
      hideEchoBack:       false,
      limitMessage:       'Requested command is not available.',
      caseSensitive:      false,
      history:            true
    }, options),
      // -------- forced
      // trueValue, falseValue, keepWhitespace don't work.
      // preCheck, limit (by clHandler)
    clHandler = getClHandler(commandHandler, readOptions);
  /* eslint-enable key-spacing */
  readOptions.limit = clHandler.limit;
  readOptions.preCheck = clHandler.preCheck;
  exports.prompt(readOptions);
  return clHandler.args;
};

exports.promptLoop = function(inputHandler, options) {
  /* eslint-disable key-spacing */
  var readOptions = margeOptions({
    // -------- default
    hideEchoBack:       false,
    trueValue:          null,
    falseValue:         null,
    caseSensitive:      false,
    history:            true
  }, options);
  /* eslint-enable key-spacing */
  while (true) { if (inputHandler(exports.prompt(readOptions))) { break; } }
  return;
};

exports.promptCLLoop = function(commandHandler, options) {
  /* eslint-disable key-spacing */
  var readOptions = margeOptions({
      // -------- default
      hideEchoBack:       false,
      limitMessage:       'Requested command is not available.',
      caseSensitive:      false,
      history:            true
    }, options),
      // -------- forced
      // trueValue, falseValue, keepWhitespace don't work.
      // preCheck, limit (by clHandler)
    clHandler = getClHandler(commandHandler, readOptions);
  /* eslint-enable key-spacing */
  readOptions.limit = clHandler.limit;
  readOptions.preCheck = clHandler.preCheck;
  while (true) {
    exports.prompt(readOptions);
    if (clHandler.hRes) { break; }
  }
  return;
};

exports.promptSimShell = function(options) {
  /* eslint-disable key-spacing */
  return exports.prompt(margeOptions({
    // -------- default
    hideEchoBack:       false,
    history:            true
  }, options, {
    // -------- forced
    prompt:             (function() {
      return IS_WIN ?
        '$<cwd>>' :
        // 'user@host:cwd$ '
        (process.env.USER || '') +
        (process.env.HOSTNAME ?
          '@' + process.env.HOSTNAME.replace(/\..*$/, '') : '') +
        ':$<cwdHome>$ ';
    })()
  }));
  /* eslint-enable key-spacing */
};

function _keyInYN(query, options, limit) {
  var res;
  if (query == null) { query = 'Are you sure? '; }
  if ((!options || options.guide !== false) && (query += '')) {
    query = query.replace(/\s*:?\s*$/, '') + ' [y/n]: ';
  }
  /* eslint-disable key-spacing */
  res = exports.keyIn(query, margeOptions(options, {
    // -------- forced
    hideEchoBack:       false,
    limit:              limit,
    trueValue:          'y',
    falseValue:         'n',
    caseSensitive:      false
    // mask doesn't work.
  }));
  // added:     guide
  /* eslint-enable key-spacing */
  return typeof res === 'boolean' ? res : '';
}
exports.keyInYN = function(query, options) { return _keyInYN(query, options); };
exports.keyInYNStrict = function(query, options) { return _keyInYN(query, options, 'yn'); };

exports.keyInPause = function(query, options) {
  if (query == null) { query = 'Continue...'; }
  if ((!options || options.guide !== false) && (query += '')) {
    query = query.replace(/\s+$/, '') + ' (Hit any key)';
  }
  /* eslint-disable key-spacing */
  exports.keyIn(query, margeOptions({
    // -------- default
    limit:              null
  }, options, {
    // -------- forced
    hideEchoBack:       true,
    mask:               ''
  }));
  // added:     guide
  /* eslint-enable key-spacing */
  return;
};

exports.keyInSelect = function(items, query, options) {
  /* eslint-disable key-spacing */
  var readOptions = margeOptions({
      // -------- default
      hideEchoBack:       false
    }, options, {
      // -------- forced
      trueValue:          null,
      falseValue:         null,
      caseSensitive:      false,
      // limit (by items),
      phContent: function(param) {
        return param === 'itemsCount' ? items.length + '' :
          param === 'firstItem' ? (items[0] + '').trim() :
          param === 'lastItem' ? (items[items.length - 1] + '').trim() : null;
      }
    }),
    // added:     guide, cancel
    keylist = '', key2i = {}, charCode = 49 /* '1' */, display = '\n';
  /* eslint-enable key-spacing */
  if (!Array.isArray(items) || !items.length || items.length > 35) {
    throw '`items` must be Array (max length: 35).';
  }

  items.forEach(function(item, i) {
    var key = String.fromCharCode(charCode);
    keylist += key;
    key2i[key] = i;
    display += '[' + key + '] ' + (item + '').trim() + '\n';
    charCode = charCode === 57 /* '9' */ ? 97 /* 'a' */ : charCode + 1;
  });
  if (!options || options.cancel !== false) {
    keylist += '0';
    key2i['0'] = -1;
    display += '[0] ' +
      (options && options.cancel != null && typeof options.cancel !== 'boolean' ?
        (options.cancel + '').trim() : 'CANCEL') + '\n';
  }
  readOptions.limit = keylist;
  display += '\n';

  if (query == null) { query = 'Choose one from list: '; }
  if ((query += '')) {
    if (!options || options.guide !== false) {
      query = query.replace(/\s*:?\s*$/, '') + ' [$<limit>]: ';
    }
    display += query;
  }

  return key2i[exports.keyIn(display, readOptions).toLowerCase()];
};

exports.getRawInput = function() { return rawInput; };

// ======== DEPRECATED ========
function _setOption(optionName, args) {
  var options;
  if (args.length) { options = {}; options[optionName] = args[0]; }
  return exports.setDefaultOptions(options)[optionName];
}
exports.setPrint = function() { return _setOption('print', arguments); };
exports.setPrompt = function() { return _setOption('prompt', arguments); };
exports.setEncoding = function() { return _setOption('encoding', arguments); };
exports.setMask = function() { return _setOption('mask', arguments); };
exports.setBufferSize = function() { return _setOption('bufferSize', arguments); };

}).call(this,require("path").join(__dirname,"node_modules","readline-sync","lib"))
},{"child_process":undefined,"crypto":undefined,"fs":undefined,"os":undefined,"path":undefined}],194:[function(require,module,exports){
'use strict';
const onetime = require('onetime');
const signalExit = require('signal-exit');

module.exports = onetime(() => {
	signalExit(() => {
		process.stderr.write('\u001b[?25h');
	}, {alwaysLast: true});
});

},{"onetime":190,"signal-exit":195}],195:[function(require,module,exports){
// Note: since nyc uses this module to output coverage, any lines
// that are in the direct sync flow of nyc's outputCoverage are
// ignored, since we can never get coverage for them.
var assert = require('assert')
var signals = require('./signals.js')

var EE = require('events')
/* istanbul ignore if */
if (typeof EE !== 'function') {
  EE = EE.EventEmitter
}

var emitter
if (process.__signal_exit_emitter__) {
  emitter = process.__signal_exit_emitter__
} else {
  emitter = process.__signal_exit_emitter__ = new EE()
  emitter.count = 0
  emitter.emitted = {}
}

// Because this emitter is a global, we have to check to see if a
// previous version of this library failed to enable infinite listeners.
// I know what you're about to say.  But literally everything about
// signal-exit is a compromise with evil.  Get used to it.
if (!emitter.infinite) {
  emitter.setMaxListeners(Infinity)
  emitter.infinite = true
}

module.exports = function (cb, opts) {
  assert.equal(typeof cb, 'function', 'a callback must be provided for exit handler')

  if (loaded === false) {
    load()
  }

  var ev = 'exit'
  if (opts && opts.alwaysLast) {
    ev = 'afterexit'
  }

  var remove = function () {
    emitter.removeListener(ev, cb)
    if (emitter.listeners('exit').length === 0 &&
        emitter.listeners('afterexit').length === 0) {
      unload()
    }
  }
  emitter.on(ev, cb)

  return remove
}

module.exports.unload = unload
function unload () {
  if (!loaded) {
    return
  }
  loaded = false

  signals.forEach(function (sig) {
    try {
      process.removeListener(sig, sigListeners[sig])
    } catch (er) {}
  })
  process.emit = originalProcessEmit
  process.reallyExit = originalProcessReallyExit
  emitter.count -= 1
}

function emit (event, code, signal) {
  if (emitter.emitted[event]) {
    return
  }
  emitter.emitted[event] = true
  emitter.emit(event, code, signal)
}

// { <signal>: <listener fn>, ... }
var sigListeners = {}
signals.forEach(function (sig) {
  sigListeners[sig] = function listener () {
    // If there are no other listeners, an exit is coming!
    // Simplest way: remove us and then re-send the signal.
    // We know that this will kill the process, so we can
    // safely emit now.
    var listeners = process.listeners(sig)
    if (listeners.length === emitter.count) {
      unload()
      emit('exit', null, sig)
      /* istanbul ignore next */
      emit('afterexit', null, sig)
      /* istanbul ignore next */
      process.kill(process.pid, sig)
    }
  }
})

module.exports.signals = function () {
  return signals
}

module.exports.load = load

var loaded = false

function load () {
  if (loaded) {
    return
  }
  loaded = true

  // This is the number of onSignalExit's that are in play.
  // It's important so that we can count the correct number of
  // listeners on signals, and don't wait for the other one to
  // handle it instead of us.
  emitter.count += 1

  signals = signals.filter(function (sig) {
    try {
      process.on(sig, sigListeners[sig])
      return true
    } catch (er) {
      return false
    }
  })

  process.emit = processEmit
  process.reallyExit = processReallyExit
}

var originalProcessReallyExit = process.reallyExit
function processReallyExit (code) {
  process.exitCode = code || 0
  emit('exit', process.exitCode, null)
  /* istanbul ignore next */
  emit('afterexit', process.exitCode, null)
  /* istanbul ignore next */
  originalProcessReallyExit.call(process, process.exitCode)
}

var originalProcessEmit = process.emit
function processEmit (ev, arg) {
  if (ev === 'exit') {
    if (arg !== undefined) {
      process.exitCode = arg
    }
    var ret = originalProcessEmit.apply(this, arguments)
    emit('exit', process.exitCode, null)
    /* istanbul ignore next */
    emit('afterexit', process.exitCode, null)
    return ret
  } else {
    return originalProcessEmit.apply(this, arguments)
  }
}

},{"./signals.js":196,"assert":undefined,"events":undefined}],196:[function(require,module,exports){
// This is not the set of all possible signals.
//
// It IS, however, the set of all signals that trigger
// an exit on either Linux or BSD systems.  Linux is a
// superset of the signal names supported on BSD, and
// the unknown signals just fail to register, so we can
// catch that easily enough.
//
// Don't bother with SIGKILL.  It's uncatchable, which
// means that we can't fire any callbacks anyway.
//
// If a user does happen to register a handler on a non-
// fatal signal like SIGWINCH or something, and then
// exit, it'll end up firing `process.emit('exit')`, so
// the handler will be fired anyway.
//
// SIGBUS, SIGFPE, SIGSEGV and SIGILL, when not raised
// artificially, inherently leave the process in a
// state from which it is not safe to try and enter JS
// listeners.
module.exports = [
  'SIGABRT',
  'SIGALRM',
  'SIGHUP',
  'SIGINT',
  'SIGTERM'
]

if (process.platform !== 'win32') {
  module.exports.push(
    'SIGVTALRM',
    'SIGXCPU',
    'SIGXFSZ',
    'SIGUSR2',
    'SIGTRAP',
    'SIGSYS',
    'SIGQUIT',
    'SIGIOT'
    // should detect profiler and enable/disable accordingly.
    // see #21
    // 'SIGPROF'
  )
}

if (process.platform === 'linux') {
  module.exports.push(
    'SIGIO',
    'SIGPOLL',
    'SIGPWR',
    'SIGSTKFLT',
    'SIGUNUSED'
  )
}

},{}],197:[function(require,module,exports){
'use strict';
const stripAnsi = require('strip-ansi');
const isFullwidthCodePoint = require('is-fullwidth-code-point');

module.exports = str => {
	if (typeof str !== 'string' || str.length === 0) {
		return 0;
	}

	str = stripAnsi(str);

	let width = 0;

	for (let i = 0; i < str.length; i++) {
		const code = str.codePointAt(i);

		// Ignore control characters
		if (code <= 0x1F || (code >= 0x7F && code <= 0x9F)) {
			continue;
		}

		// Ignore combining characters
		if (code >= 0x300 && code <= 0x36F) {
			continue;
		}

		// Surrogates
		if (code > 0xFFFF) {
			i++;
		}

		width += isFullwidthCodePoint(code) ? 2 : 1;
	}

	return width;
};

},{"is-fullwidth-code-point":187,"strip-ansi":198}],198:[function(require,module,exports){
'use strict';
const ansiRegex = require('ansi-regex');

module.exports = input => typeof input === 'string' ? input.replace(ansiRegex(), '') : input;

},{"ansi-regex":15}],199:[function(require,module,exports){
'use strict';
const os = require('os');
const hasFlag = require('has-flag');

const env = process.env;

let forceColor;
if (hasFlag('no-color') ||
	hasFlag('no-colors') ||
	hasFlag('color=false')) {
	forceColor = false;
} else if (hasFlag('color') ||
	hasFlag('colors') ||
	hasFlag('color=true') ||
	hasFlag('color=always')) {
	forceColor = true;
}
if ('FORCE_COLOR' in env) {
	forceColor = env.FORCE_COLOR.length === 0 || parseInt(env.FORCE_COLOR, 10) !== 0;
}

function translateLevel(level) {
	if (level === 0) {
		return false;
	}

	return {
		level,
		hasBasic: true,
		has256: level >= 2,
		has16m: level >= 3
	};
}

function supportsColor(stream) {
	if (forceColor === false) {
		return 0;
	}

	if (hasFlag('color=16m') ||
		hasFlag('color=full') ||
		hasFlag('color=truecolor')) {
		return 3;
	}

	if (hasFlag('color=256')) {
		return 2;
	}

	if (stream && !stream.isTTY && forceColor !== true) {
		return 0;
	}

	const min = forceColor ? 1 : 0;

	if (process.platform === 'win32') {
		// Node.js 7.5.0 is the first version of Node.js to include a patch to
		// libuv that enables 256 color output on Windows. Anything earlier and it
		// won't work. However, here we target Node.js 8 at minimum as it is an LTS
		// release, and Node.js 7 is not. Windows 10 build 10586 is the first Windows
		// release that supports 256 colors. Windows 10 build 14931 is the first release
		// that supports 16m/TrueColor.
		const osRelease = os.release().split('.');
		if (
			Number(process.versions.node.split('.')[0]) >= 8 &&
			Number(osRelease[0]) >= 10 &&
			Number(osRelease[2]) >= 10586
		) {
			return Number(osRelease[2]) >= 14931 ? 3 : 2;
		}

		return 1;
	}

	if ('CI' in env) {
		if (['TRAVIS', 'CIRCLECI', 'APPVEYOR', 'GITLAB_CI'].some(sign => sign in env) || env.CI_NAME === 'codeship') {
			return 1;
		}

		return min;
	}

	if ('TEAMCITY_VERSION' in env) {
		return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
	}

	if (env.COLORTERM === 'truecolor') {
		return 3;
	}

	if ('TERM_PROGRAM' in env) {
		const version = parseInt((env.TERM_PROGRAM_VERSION || '').split('.')[0], 10);

		switch (env.TERM_PROGRAM) {
			case 'iTerm.app':
				return version >= 3 ? 3 : 2;
			case 'Apple_Terminal':
				return 2;
			// No default
		}
	}

	if (/-256(color)?$/i.test(env.TERM)) {
		return 2;
	}

	if (/^screen|^xterm|^vt100|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
		return 1;
	}

	if ('COLORTERM' in env) {
		return 1;
	}

	if (env.TERM === 'dumb') {
		return min;
	}

	return min;
}

function getSupportLevel(stream) {
	const level = supportsColor(stream);
	return translateLevel(level);
}

module.exports = {
	supportsColor: getSupportLevel,
	stdout: getSupportLevel(process.stdout),
	stderr: getSupportLevel(process.stderr)
};

},{"has-flag":186,"os":undefined}],200:[function(require,module,exports){
module.exports = function (rows_, opts) {
    if (!opts) opts = {};
    var hsep = opts.hsep === undefined ? '  ' : opts.hsep;
    var align = opts.align || [];
    var stringLength = opts.stringLength
        || function (s) { return String(s).length; }
    ;
    
    var dotsizes = reduce(rows_, function (acc, row) {
        forEach(row, function (c, ix) {
            var n = dotindex(c);
            if (!acc[ix] || n > acc[ix]) acc[ix] = n;
        });
        return acc;
    }, []);
    
    var rows = map(rows_, function (row) {
        return map(row, function (c_, ix) {
            var c = String(c_);
            if (align[ix] === '.') {
                var index = dotindex(c);
                var size = dotsizes[ix] + (/\./.test(c) ? 1 : 2)
                    - (stringLength(c) - index)
                ;
                return c + Array(size).join(' ');
            }
            else return c;
        });
    });
    
    var sizes = reduce(rows, function (acc, row) {
        forEach(row, function (c, ix) {
            var n = stringLength(c);
            if (!acc[ix] || n > acc[ix]) acc[ix] = n;
        });
        return acc;
    }, []);
    
    return map(rows, function (row) {
        return map(row, function (c, ix) {
            var n = (sizes[ix] - stringLength(c)) || 0;
            var s = Array(Math.max(n + 1, 1)).join(' ');
            if (align[ix] === 'r' || align[ix] === '.') {
                return s + c;
            }
            if (align[ix] === 'c') {
                return Array(Math.ceil(n / 2 + 1)).join(' ')
                    + c + Array(Math.floor(n / 2 + 1)).join(' ')
                ;
            }
            
            return c + s;
        }).join(hsep).replace(/\s+$/, '');
    }).join('\n');
};

function dotindex (c) {
    var m = /\.[^.]*$/.exec(c);
    return m ? m.index + 1 : c.length;
}

function reduce (xs, f, init) {
    if (xs.reduce) return xs.reduce(f, init);
    var i = 0;
    var acc = arguments.length >= 3 ? init : xs[i++];
    for (; i < xs.length; i++) {
        f(acc, xs[i], i);
    }
    return acc;
}

function forEach (xs, f) {
    if (xs.forEach) return xs.forEach(f);
    for (var i = 0; i < xs.length; i++) {
        f.call(xs, xs[i], i);
    }
}

function map (xs, f) {
    if (xs.map) return xs.map(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        res.push(f.call(xs, xs[i], i));
    }
    return res;
}

},{}],201:[function(require,module,exports){
'use strict';
var styles = module.exports;

var codes = {
	reset: [0, 0],

	bold: [1, 22],
	italic: [3, 23],
	underline: [4, 24],
	inverse: [7, 27],
	strikethrough: [9, 29],

	black: [30, 39],
	red: [31, 39],
	green: [32, 39],
	yellow: [33, 39],
	blue: [34, 39],
	magenta: [35, 39],
	cyan: [36, 39],
	white: [37, 39],
	gray: [90, 39],

	bgBlack: [40, 49],
	bgRed: [41, 49],
	bgGreen: [42, 49],
	bgYellow: [43, 49],
	bgBlue: [44, 49],
	bgMagenta: [45, 49],
	bgCyan: [46, 49],
	bgWhite: [47, 49]
};

Object.keys(codes).forEach(function (key) {
	var val = codes[key];
	var style = styles[key] = {};
	style.open = '\x1b[' + val[0] + 'm';
	style.close = '\x1b[' + val[1] + 'm';
});

},{}],202:[function(require,module,exports){
'use strict';
var ansi = require('ansi-styles');
var stripAnsi = require('strip-ansi');
var hasColor = require('has-color');
var defineProps = Object.defineProperties;
var chalk = module.exports;

var styles = (function () {
	var ret = {};

	ansi.grey = ansi.gray;

	Object.keys(ansi).forEach(function (key) {
		ret[key] = {
			get: function () {
				this._styles.push(key);
				return this;
			}
		};
	});

	return ret;
})();

function init() {
	var ret = {};

	Object.keys(styles).forEach(function (name) {
		ret[name] = {
			get: function () {
				var obj = defineProps(function self() {
					var str = [].slice.call(arguments).join(' ');

					if (!chalk.enabled) {
						return str;
					}

					return self._styles.reduce(function (str, name) {
						var code = ansi[name];
						return str ? code.open + str + code.close : '';
					}, str);
				}, styles);

				obj._styles = [];

				return obj[name];
			}
		}
	});

	return ret;
}

defineProps(chalk, init());

chalk.styles = ansi;
chalk.stripColor = stripAnsi;
chalk.supportsColor = hasColor;

// detect mode if not set manually
if (chalk.enabled === undefined) {
	chalk.enabled = chalk.supportsColor;
}

},{"ansi-styles":201,"has-color":185,"strip-ansi":203}],203:[function(require,module,exports){
'use strict';
module.exports = function (str) {
	return typeof str === 'string' ? str.replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g, '') : str;
};

},{}],204:[function(require,module,exports){
/**
 * requireHook - module wrapping a function that register require() listener and returns hook/unhook control
 *
 * @author Ciprian Popa (cyparu)
 * @since 0.0.1
 * @version 0.0.1
 */

"use strict";

var Module = require("module").Module,
		_load = Module._load,
		_hookedAt, _listener;

/**
 * Module hooker function that will replace Module._load and invoke the _listener with module and timing information
 *
 * @function _hooker
 */
function _hooker(name, parent) {
	var timeIn = Date.now(),
			exports = _load.apply(Module, arguments),
			timeOut = Date.now(),
			mod = parent.children[parent.children.length - 1]; // should be the last loaded children
	// call the listener
	_listener({
		name: name,
		parent: parent,
		module: mod,
		filename: mod ? mod.filename : name,
		exports: exports,
		requiredOn: timeIn,
		startedIn: timeOut - timeIn
	});
	return exports;
}

/**
 * Hook Node's require() so the configured callback will be invocked with additional module and time loading information information
 *
 * @param {Function} [listener] - optional listener if
 * @method hook
 */
function _hook(listener) {
	if (typeof listener !== "undefined") {
		if (typeof listener !== "function") {
			throw new Error("The optional parameter for hook() should be a function but was " + (typeof listener));
		}
		// set the listener
		_listener = listener;
	}
	// set the hoocker loader
	Module._load = _hooker;
	// mark hooked time
	_hookedAt = new Date();
}

/**
 * Unhook Node's require() to the original function
 *
 * @method unhook
 */
function _unhook() {
	// set the original loader
	Module._load = _load;
	// reset hooking time
	_hookedAt = undefined;
}

/**
 * Export a function that set the callback and return hook/unhook control functionality
 *
 * @function
 * @param {Function} listener - require() listener
 * @param {Boolean} [autohook=true] - optional flag telling if the hooking will be started automatically
 * @return hook/unhook control function
 */
module.exports = function(listener, autohook) {
	if (typeof listener !== "function") {
		throw new Error("The hooking function should be set");
	}
	// set the listener
	_listener = listener;
	// if autohook (by default),
	if (autohook !== false) {
		_hook();
	}
	return {
		hookedAt: _hookedAt,
		hook: _hook,
		unhook: _unhook
	};
};

},{"module":undefined}],205:[function(require,module,exports){
/**
 * timeRequire - measure the time to load all the subsequnt modules by hoocking require() calls
 *
 * @author Ciprian Popa (cyparu)
 * @since 0.0.1
 * @version 0.0.1
 */

"use strict";

var // setup vars
		requireData = [],
		write = process.stdout.write.bind(process.stdout),
		relative = require("path").relative,
		cwd = process.cwd(),
		// require hooker should be first module loaded so all the other requires should count as well
		/* jshint -W003 */
		hook = require("./requireHook")(_hooker),
		table = require("text-table"),
		dateTime = require("date-time"),
		prettyMs = require("pretty-ms"),
		chalk = require("chalk"),
		// extra locals
		DEFAULT_COLUMNS = 80,
		BAR_CHAR = process.platform === "win32" ? "■" : "▇",
		sorted = hasArg("--sorted") || hasArg("--s"),
		treshold = (hasArg("--verbose") || hasArg("--V")) ? 0.0: 0.01, // TODO - configure treshold using CLI ?
		EXTRA_COLUMNS = sorted ? 24 : 20;

function hasArg(arg) {
	return process.argv.indexOf(arg) !== -1;
}

function pad(count, seq) {
	return (count > 1) ? new Array(count).join(seq) : "";
}

function log(str) {
	write(str + "\n", "utf8");
}

/**
 * Callback/listener used by requireHook hook to collect all the modules in their loading order
 */
function _hooker(data) {
	var filename = relative(cwd, data.filename);
	// use the shortest name
	if (filename.length > data.filename) {
		filename = data.filename;
	}
	requireData.push({
		order: requireData.length, // loading order
		time: data.startedIn, // time
		label: data.name + " (" + filename + ")"
//		name: data.name,
//		filename: filename
	});
}

function formatTable(tableData, totalTime) {
	var NAME_FILE_REX = /(.+)( \(.+\))/,
			maxColumns = process.stdout.columns || DEFAULT_COLUMNS,
			validCount = 0,
			longestRequire = tableData.reduce(function(acc, data) {
				var avg = data.time / totalTime;
				if (avg < treshold) {
					return acc;
				}
				validCount++;
				return Math.max(acc, data.label.length);
			}, 0),
			maxBarWidth = (longestRequire > maxColumns / 2) ? ((maxColumns - EXTRA_COLUMNS) / 2) : (maxColumns - (longestRequire + EXTRA_COLUMNS)),
			processedTableData = [],
			counter, maxOrderChars;

	function shorten(name) {
		var nameLength = name.length,
				partLength, start, end;
		if (name.length < maxBarWidth) {
			return name;
		}
		partLength = Math.floor((maxBarWidth - 3) / 2);
		start = name.substr(0, partLength + 1);
		end = name.substr(nameLength - partLength);
		return start.trim() + "..." + end.trim();
	}

	function createBar(percentage) {
		var rounded = Math.round(percentage * 100);
		return ((rounded === 0) ? "0" : (pad(Math.ceil(maxBarWidth * percentage) + 1, BAR_CHAR) + " " + rounded)) + "%";
	}

	// sort the data if needed
	if (sorted) {
		tableData.sort(function(e1, e2) {
			return e2.time - e1.time;
		});
	}
	// initialize the counter
	counter = 1;
	// get num ber of chars for padding
	maxOrderChars = tableData.length.toString().length;
	// push the header
	processedTableData.push(["#" + (sorted ? " [order]" : ""), "module", "time", "%"]);
	tableData.forEach(function(data) {
		var avg = data.time / totalTime,
				counterLabel, label, match;
		// slect just data over the threshold
		if (avg >= treshold) {
			counterLabel = counter++;
			// for sorted collumns show the order loading with padding
			if (sorted) {
				counterLabel += pad(maxOrderChars - data.order.toString().length + 1, " ") + " [" + data.order + "]";
			}
			label = shorten(data.label);
			match = label.match(NAME_FILE_REX);
			if (match) {
				label = chalk.green(match[1]) + match[2];
			}
			processedTableData.push([counterLabel, label, chalk.yellow(prettyMs(data.time)), chalk.blue(createBar(avg))]);
		}
	});

	return table(processedTableData, {
		align: ["r", "l", "r", "l"],
		stringLength: function(str) {
			return chalk.stripColor(str).length;
		}
	});
}

// hook process exit to display the report at the end
process.once("exit", function() {
	var startTime = hook.hookedAt,
			totalTime = Date.now() - startTime.getTime();
	log("\n\n" + chalk.underline("Start time: " + chalk.yellow("(" + dateTime(startTime) + ")") + " [treshold=" + (treshold * 100) + "%" + (sorted ? ",sorted" : "") + "]"));
	log(formatTable(requireData, totalTime));
	log(chalk.bold.blue("Total require(): ") + chalk.yellow(requireData.length));
	log(chalk.bold.blue("Total time: ") + chalk.yellow(prettyMs(totalTime)));
});

},{"./requireHook":204,"chalk":202,"date-time":183,"path":undefined,"pretty-ms":192,"text-table":200}],206:[function(require,module,exports){
/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
var byteToHex = [];
for (var i = 0; i < 256; ++i) {
  byteToHex[i] = (i + 0x100).toString(16).substr(1);
}

function bytesToUuid(buf, offset) {
  var i = offset || 0;
  var bth = byteToHex;
  return bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]];
}

module.exports = bytesToUuid;

},{}],207:[function(require,module,exports){
// Unique ID creation requires a high quality random # generator.  In node.js
// this is pretty straight-forward - we use the crypto API.

var crypto = require('crypto');

module.exports = function nodeRNG() {
  return crypto.randomBytes(16);
};

},{"crypto":undefined}],208:[function(require,module,exports){
var rng = require('./lib/rng');
var bytesToUuid = require('./lib/bytesToUuid');

// **`v1()` - Generate time-based UUID**
//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html

var _nodeId;
var _clockseq;

// Previous uuid creation time
var _lastMSecs = 0;
var _lastNSecs = 0;

// See https://github.com/broofa/node-uuid for API details
function v1(options, buf, offset) {
  var i = buf && offset || 0;
  var b = buf || [];

  options = options || {};
  var node = options.node || _nodeId;
  var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq;

  // node and clockseq need to be initialized to random values if they're not
  // specified.  We do this lazily to minimize issues related to insufficient
  // system entropy.  See #189
  if (node == null || clockseq == null) {
    var seedBytes = rng();
    if (node == null) {
      // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
      node = _nodeId = [
        seedBytes[0] | 0x01,
        seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]
      ];
    }
    if (clockseq == null) {
      // Per 4.2.2, randomize (14 bit) clockseq
      clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 0x3fff;
    }
  }

  // UUID timestamps are 100 nano-second units since the Gregorian epoch,
  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
  var msecs = options.msecs !== undefined ? options.msecs : new Date().getTime();

  // Per 4.2.1.2, use count of uuid's generated during the current clock
  // cycle to simulate higher resolution clock
  var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;

  // Time since last uuid creation (in msecs)
  var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

  // Per 4.2.1.2, Bump clockseq on clock regression
  if (dt < 0 && options.clockseq === undefined) {
    clockseq = clockseq + 1 & 0x3fff;
  }

  // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
  // time interval
  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  }

  // Per 4.2.1.2 Throw error if too many uuids are requested
  if (nsecs >= 10000) {
    throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
  }

  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq;

  // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
  msecs += 12219292800000;

  // `time_low`
  var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  b[i++] = tl >>> 24 & 0xff;
  b[i++] = tl >>> 16 & 0xff;
  b[i++] = tl >>> 8 & 0xff;
  b[i++] = tl & 0xff;

  // `time_mid`
  var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
  b[i++] = tmh >>> 8 & 0xff;
  b[i++] = tmh & 0xff;

  // `time_high_and_version`
  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
  b[i++] = tmh >>> 16 & 0xff;

  // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
  b[i++] = clockseq >>> 8 | 0x80;

  // `clock_seq_low`
  b[i++] = clockseq & 0xff;

  // `node`
  for (var n = 0; n < 6; ++n) {
    b[i + n] = node[n];
  }

  return buf ? buf : bytesToUuid(b);
}

module.exports = v1;

},{"./lib/bytesToUuid":206,"./lib/rng":207}],209:[function(require,module,exports){
'use strict';
const stringWidth = require('string-width');
const stripAnsi = require('strip-ansi');

const ESCAPES = new Set([
	'\u001B',
	'\u009B'
]);

const END_CODE = 39;

const ESCAPE_CODES = new Map([
	[0, 0],
	[1, 22],
	[2, 22],
	[3, 23],
	[4, 24],
	[7, 27],
	[8, 28],
	[9, 29],
	[30, 39],
	[31, 39],
	[32, 39],
	[33, 39],
	[34, 39],
	[35, 39],
	[36, 39],
	[37, 39],
	[90, 39],
	[40, 49],
	[41, 49],
	[42, 49],
	[43, 49],
	[44, 49],
	[45, 49],
	[46, 49],
	[47, 49]
]);

const wrapAnsi = code => `${ESCAPES.values().next().value}[${code}m`;

// Calculate the length of words split on ' ', ignoring
// the extra characters added by ansi escape codes
const wordLengths = str => str.split(' ').map(s => stringWidth(s));

// Wrap a long word across multiple rows
// Ansi escape codes do not count towards length
const wrapWord = (rows, word, cols) => {
	const arr = Array.from(word);

	let insideEscape = false;
	let visible = stringWidth(stripAnsi(rows[rows.length - 1]));

	for (const item of arr.entries()) {
		const i = item[0];
		const char = item[1];
		const charLength = stringWidth(char);

		if (visible + charLength <= cols) {
			rows[rows.length - 1] += char;
		} else {
			rows.push(char);
			visible = 0;
		}

		if (ESCAPES.has(char)) {
			insideEscape = true;
		} else if (insideEscape && char === 'm') {
			insideEscape = false;
			continue;
		}

		if (insideEscape) {
			continue;
		}

		visible += charLength;

		if (visible === cols && i < arr.length - 1) {
			rows.push('');
			visible = 0;
		}
	}

	// It's possible that the last row we copy over is only
	// ansi escape characters, handle this edge-case
	if (!visible && rows[rows.length - 1].length > 0 && rows.length > 1) {
		rows[rows.length - 2] += rows.pop();
	}
};

// The wrap-ansi module can be invoked
// in either 'hard' or 'soft' wrap mode
//
// 'hard' will never allow a string to take up more
// than cols characters
//
// 'soft' allows long words to expand past the column length
const exec = (str, cols, opts) => {
	const options = opts || {};

	if (str.trim() === '') {
		return options.trim === false ? str : str.trim();
	}

	let pre = '';
	let ret = '';
	let escapeCode;

	const lengths = wordLengths(str);
	const words = str.split(' ');
	const rows = [''];

	for (const item of Array.from(words).entries()) {
		const i = item[0];
		const word = item[1];

		rows[rows.length - 1] = options.trim === false ? rows[rows.length - 1] : rows[rows.length - 1].trim();
		let rowLength = stringWidth(rows[rows.length - 1]);

		if (rowLength || word === '') {
			if (rowLength === cols && options.wordWrap === false) {
				// If we start with a new word but the current row length equals the length of the columns, add a new row
				rows.push('');
				rowLength = 0;
			}

			rows[rows.length - 1] += ' ';
			rowLength++;
		}

		// In 'hard' wrap mode, the length of a line is
		// never allowed to extend past 'cols'
		if (lengths[i] > cols && options.hard) {
			if (rowLength) {
				rows.push('');
			}
			wrapWord(rows, word, cols);
			continue;
		}

		if (rowLength + lengths[i] > cols && rowLength > 0) {
			if (options.wordWrap === false && rowLength < cols) {
				wrapWord(rows, word, cols);
				continue;
			}

			rows.push('');
		}

		if (rowLength + lengths[i] > cols && options.wordWrap === false) {
			wrapWord(rows, word, cols);
			continue;
		}

		rows[rows.length - 1] += word;
	}

	pre = rows.map(r => options.trim === false ? r : r.trim()).join('\n');

	for (const item of Array.from(pre).entries()) {
		const i = item[0];
		const char = item[1];

		ret += char;

		if (ESCAPES.has(char)) {
			const code = parseFloat(/\d[^m]*/.exec(pre.slice(i, i + 4)));
			escapeCode = code === END_CODE ? null : code;
		}

		const code = ESCAPE_CODES.get(Number(escapeCode));

		if (escapeCode && code) {
			if (pre[i + 1] === '\n') {
				ret += wrapAnsi(code);
			} else if (char === '\n') {
				ret += wrapAnsi(escapeCode);
			}
		}
	}

	return ret;
};

// For each newline, invoke the method separately
module.exports = (str, cols, opts) => {
	return String(str)
		.normalize()
		.split('\n')
		.map(line => exec(line, cols, opts))
		.join('\n');
};

},{"string-width":197,"strip-ansi":198}],210:[function(require,module,exports){
module.exports={
  "name": "@schwingbat/punch",
  "version": "1.13.0",
  "description": "A CLI time tracker that syncs.",
  "main": "main.js",
  "bin": {
    "punch": "./main.js"
  },
  "scripts": {
    "test": "jest"
  },
  "keywords": [],
  "author": "Tony McCoy <tony@ratwizard.io>",
  "repository": "github:schwingbat/punch",
  "license": "MIT",
  "dependencies": {
    "aws-sdk": "^2.226.1",
    "chalk": "^2.4.0",
    "date-fns": "^1.29.0",
    "handlebars": "^4.0.11",
    "html5-to-pdf": "^2.2.9",
    "log-update": "^2.3.0",
    "readline-sync": "^1.4.9",
    "uuid": "^3.2.1"
  },
  "devDependencies": {
    "jest": "^22.4.3",
    "time-require": "^0.1.2",
    "standard": "^11.0.1",
    "eslint": "^4.19.1"
  },
  "standard": {
    "globals": [
      "describe",
      "it",
      "expect",
      "beforeEach",
      "beforeAll",
      "jest"
    ]
  }
}

},{}],211:[function(require,module,exports){
const uuid = require('uuid/v1')

module.exports = function (config, Storage) {
  class Punch {
    /*
      id: string
      project: string
      in: Date
      out?: Date
      comments: Comment[]
      rate: number
      created: Date
      updated: Date
    */

    constructor (props) {
      if (typeof props !== 'object' || Array.isArray(props)) {
        throw new Error('The only argument to the Punch constructor should be an object. Received ' + typeof props)
      }
      if (typeof props.project !== 'string') {
        throw new Error('Punch requires a "project" field (string) to be specified in the props object.')
      }

      this.id = props.id || uuid()
      this.project = props.project
      this.in = new Date(props.in || new Date())
      this.out = props.out ? new Date(props.out || new Date()) : null
      this.comments = props.comments
        ? props.comments.map(c => new Comment(c.comment || c, c.timestamp))
        : []
      if (props.rate) {
        this.rate = props.rate
      } else if (config.projects[props.project]) {
        this.rate = config.projects[props.project].hourlyRate || 0
      } else {
        this.rate = 0
      }

      if (this.out && this.out < this.in) {
        throw new Error(`Punch out time cannot be earlier than punch in time. ${this.project} ${this.in} ${this.out}`)
      }

      this.created = new Date(props.created || new Date())
      this.updated = new Date(props.updated || new Date())
    }

    addComment (comment) {
      this.comments.push(new Comment(comment))
    }

    punchOut (comment, options = {}) {
      this.out = options.time || new Date()

      if (comment) this.addComment(comment)
      if (options.autosave) this.save()
    }

    duration () {
      return (this.out || new Date()).getTime() - this.in
    }

    pay () {
      // Hours * hourlyRate
      return this.duration() / 3600000 * this.rate
    }

    toJSON () {
      return {
        id: this.id,
        project: this.project,
        in: this.in.getTime(),
        out: this.out ? this.out.getTime() : null,
        rate: this.rate,
        comments: this.comments.map(comment => comment.toJSON()),
        created: this.created.getTime(),
        updated: this.updated.getTime()
      }
    }

    async save () {
      return storage.save(this)
    }
  }

  // Gotta love that function scope.
  // Can't put it above the class, but
  // it's used within the class.
  var storage = Storage(config, Punch)

  Punch.current = async function (project) {
    return storage.current(project)
  }

  Punch.latest = async function () {
    return storage.latest()
  }

  Punch.select = async function (test) {
    return storage.select(test)
  }

  Punch.all = async function () {
    return storage.select(() => true)
  }

  class Comment {
    constructor (comment, timestamp = new Date()) {
      this.comment = comment
      this.timestamp = new Date(timestamp)
    }

    toString () {
      return this.comment
    }

    toJSON () {
      return {
        comment: this.comment,
        timestamp: this.timestamp.getTime()
      }
    }
  }

  return Punch
}

},{"uuid/v1":208}],212:[function(require,module,exports){
(function (__dirname){
module.exports = function (config) {
  const fs = require('fs')
  const path = require('path')
  const servicePath = path.join(__dirname, 'services')

  const filePath = path.join(servicePath, config.storageType.toLowerCase() + '.service.js')

  if (fs.existsSync(filePath)) {
    return require(filePath)
  } else {
    throw new Error(`Storage service ${config.storageType} does not exist.`)
  }
}

}).call(this,require("path").join(__dirname,"storage"))
},{"fs":undefined,"path":undefined}],213:[function(require,module,exports){
(function (__dirname){
const fs = require('fs')
const path = require('path')
const SyncService = require('./syncservice')

class Syncer {
  constructor (config, Punch) {
    if (!config) {
      throw new Error('Syncer requires a config object as the first parameter')
    }
    if (!Punch) {
      throw new Error('Syncer requires the Punch class to be passed as the second parameter')
    }

    this._config = config
    this._punch = Punch
  }

  _loadService (service) {
    if (service instanceof SyncService) {
      return service
    }

    if (typeof service !== 'string') {
      throw new Error('_loadService requires either a string or instance of SyncService')
    }

    const conf = this._config.sync.services
      .find(s => s.name.toLowerCase() === service.toLowerCase())

    if (conf) {
      const modulePath = path.join(__dirname, 'services', service.toLowerCase() + '.service.js')
      if (fs.existsSync(modulePath)) {
        const Service = require(modulePath)
        return new Service(conf)
      } else {
        throw new Error(`Service ${service} is not (yet) supported.`)
      }
    } else {
      throw new Error(`Service ${service} is not configured in config.sync.services`)
    }
  }

  async _diff (manifest) {
    const punches = await this._punch.all()

    const uploads = punches.filter(punch => {
      // Upload if punch doesn't exist remotely or if local copy is newer.
      return !manifest[punch.id] || manifest[punch.id] < punch.updated
    })

    const downloads = []
    for (const id in manifest) {
      // Download if punch doesn't exist locally or if remote copy is newer.
      const punch = punches.find(p => p.id === id)
      if (!punch || punch.updated < manifest[id]) {
        downloads.push(id)
      }
    }

    return { uploads, downloads }
  }

  async sync (service) {
    /*
      Multi-sync
      - Get all manifests
      - Compare manifests and local against each other
      - Build upload/download lists for each service
      - Order requests so newest punches are fetched first

      For now it's just single sync
    */

    if (service instanceof SyncService || typeof service === 'string') {
      service = this._loadService(service)

      const manifest = await service.getManifest()
      const { uploads, downloads } = await this._diff(manifest)

      const uploaded = await service.upload(uploads)
      const downloaded = await service.download(downloads)

      downloaded.forEach(punch => {
        punch.save()
      })

      return { uploaded, downloaded }
    } else {
      throw new Error('First parameter must be a string or an instance of SyncService')
    }
  }
}

module.exports = Syncer

}).call(this,require("path").join(__dirname,"sync"))
},{"./syncservice":214,"fs":undefined,"path":undefined}],214:[function(require,module,exports){
class SyncService {
  constructor (config) {
    if (!config) {
      throw new Error('Sync services require a config object as the first parameter')
    }
    this._config = config
  }
}

module.exports = SyncService

},{}],215:[function(require,module,exports){
module.exports = function bench (options = {}) {
  const chalk = require('chalk')
  let start = Date.now()
  let marks = []

  function printMark (mark, i) {
    const difference = mark.time - start
    const sinceLast = mark.time - (marks[i - 1] ? marks[i - 1].time : start)
    console.log(`@ ${difference}ms: ${mark.comment} ${chalk.bold(`+${sinceLast}ms`)}`)
  }

  return {
    mark: function (comment, opts = {}) {
      if (!options.disabled) {
        let mark = {
          time: Date.now(),
          comment
        }
        if (opts.print) {
          printMark(mark, marks.length - 1)
        }
        marks.push(mark)
      }
    },
    printAll: function () {
      if (options.disabled !== true) {
        marks.forEach(printMark)
      }
    }
  }
}

},{"chalk":16}],216:[function(require,module,exports){
module.exports = function ({ style, letterSpacing }) {
  const path = require('path')
  // const chalk = require('chalk')
  let clock

  style = style || 'block-clock'
  letterSpacing = letterSpacing || 1

  try {
    clock = require(path.join(global.appRoot, 'resources', 'clock-styles', style + '.json'))
  } catch (err) {
    throw new Error('Failed to load clock style: ' + style)
  }

  const spaceChar = clock.spaceCharacter || ' '

  for (const char in clock.characters) {
    clock.characters[char].lines = clock.characters[char].lines.map(line => {
      return line.replace(/\s/g, spaceChar)
    })
  }

  // Validate

  function validate (characters) {
    const errors = []

    for (const char in characters) {
      const { width, height, lines } = characters[char]

      if (lines.length !== height) {
        errors.push(`Character ${char} has a height of ${height}, but has ${lines.length} lines.`)
        continue
      }

      lines.forEach((line, i) => {
        if (line.length !== width) {
          errors.push(`Line at index ${i} of character ${char} should be ${width} characters wide. Is ${line.length} wide.`)
        }
      })
    }

    return errors
  }

  const errors = validate(clock.characters)
  if (errors.length > 0) {
    console.error(errors)
  }

  return {
    display (string) {
      const chars = string.split('').map(c => clock.characters[c])

      let output = ''
      let height = Math.max(...chars.map(c => c.height))
      let remaining = height

      while (remaining > 0) {
        output += spaceChar
        chars.forEach((char, i) => {
          output += char.lines[height - remaining]
          if (i + 1 !== chars.length) {
            output += spaceChar
          }
        })
        output += spaceChar
        output += '\n'
        remaining--
      }

      return output
    }
  }
}
},{"path":undefined}],217:[function(require,module,exports){
const chalk = require('chalk')

function parseSignature (str) {
  let i = 0
  let end = str.length
  const argMap = []

  let buffer = ''
  let inArg = false
  let isRequired = false
  let isVariadic = false

  const addArg = () => {
    const obj = {
      name: buffer,
      required: isRequired,
      variadic: isVariadic
    }

    argMap.push(obj)
    buffer = ''

    inArg = false
    isRequired = false
    isVariadic = false
  }

  while (i < end) {
    switch (str[i]) {
      case '<':
        inArg = true
        isRequired = true
        break
      case '>':
        addArg()
        break
      case '[':
        inArg = true
        isRequired = false
        break
      case ']':
        addArg()
        break
      case '.':
        if (inArg && buffer.length > 0) {
          let eq = str[i] === '.' &&
                   str[i + 1] === '.' &&
                   str[i + 2] === '.'

          if (eq) {
            i += 2
            isVariadic = true
          }
        }
        break
      case ' ':
        break
      default:
        if (inArg) {
          buffer += str[i]
        }
        break
    }

    i += 1
  }

  if (buffer.length > 0) {
    if (inArg) {
      addArg()
    }
  }

  return argMap
}

function applyArgExtras (argMap, extras) {
  // Apply any extra properties provided in the arguments array when the command
  // was instantated. Descriptions, parsing functions and other properties are
  // added to their respective arguments.

  if (extras) {
    extras.forEach(props => {
      const mapped = argMap.find(arg => arg.name === props.name)
      if (mapped) {
        mapped.description = props.description
        mapped.parse = props.parse
        if (props.default) {
          mapped.default = props.default
        }
      }
    })
  }

  return argMap
}

function mapArgs (args, argMap) {
  // Using a command's argMap, map the args to their proper names.

  const mapped = {}

  // TODO: Parse option flags and add values here
  Object.defineProperty(mapped, 'options', {
    value: {},
    enumerable: false
  })

  argMap.forEach((arg, i) => {
    if (args[i]) {
      let value
      if (arg.variadic) {
        value = args.slice(i)
      } else {
        value = args[i]
      }
      if (typeof arg.parse === 'function') {
        try {
          value = arg.parse(value)
        } catch (err) {
          arg._error = err
        }
      }
      mapped[arg.name] = value
    } else if (arg.hasOwnProperty('default')) {
      if (typeof arg.default === 'function') {
        mapped[arg.name] = arg.default()
      } else {
        mapped[arg.name] = arg.default
      }
    }
  })

  return mapped
}

function requiredArgsProvided (mappedArgs, argMap) {
  // Make sure the non-optional args are all supplied.

  for (let i = 0; i < argMap.length; i++) {
    const marg = argMap[i]
    if (marg.required && !mappedArgs[marg.name]) {
      return false
    }
  }

  return true
}

const paramExplanation = `
  a ${chalk.bold('<param>')} is required
  a ${chalk.bold('[param]')} is optional
  a ${chalk.bold('param...')} groups any arguments after this point into one argument
`

function indent (depth = 1) {
  let str = ''
  while (str.length < depth * 2) {
    str += '  '
  }
  return str
}

function makeHelp (programName, command, argMap, mapped) {
  let str = '\n'

  str += `Usage: ${programName} ${command}`

  argMap.forEach(arg => {
    let argStr = ' '
    if (arg.variadic) {
      arg.name += '...'
    }

    if (arg.required) {
      argStr += `<${arg.name}>`
    } else {
      argStr += `[${arg.name}]`
    }

    if (arg._error) {
      str += chalk.bold.red(argStr)
    } else {
      // Highlight in red if this arg was missed.
      if (!mapped[arg.name]) {
        if (arg.required) {
          str += chalk.bold.red(argStr)
        } else {
          str += chalk.bold.yellow(argStr)
        }
      } else {
        str += argStr
      }
    }
  })

  return str + '\n'
}

function makeGeneralHelp (program, commands) {
  let str = '\n'

  str += indent() + program.name + ' v' + program.version + '\n'
  str += paramExplanation + '\n'
  str += chalk.bold('  Commands:') + '\n'

  for (const cmd in commands) {
    const { signature, description, hidden } = commands[cmd]

    if (!hidden) {
      str += indent(2) + signature + '\n'
      if (description) {
        str += indent(3) + chalk.italic.grey(description) + '\n'
      }
    }
  }

  return str + '\n'
}

function CLI (program) {
  const commands = {}

  const command = (config) => {
    if (!config || config.disabled) {
      // BAIL!
      return
    }

    const { signature, description, run } = config

    const command = signature.split(' ')[0]

    commands[command] = {
      signature,
      description,
      args: applyArgExtras(
        parseSignature(signature),
        config.arguments
      ),
      hidden: !!config.hidden,
      run
    }
  }

  const run = (args) => {
    const command = args[0]
    const cmd = commands[command]

    if (!cmd || command.toLowerCase() === 'help') {
      return console.log(makeGeneralHelp(program, commands))
    }

    const mapped = mapArgs(args.slice(1), cmd.args)

    for (let i = 0; i < cmd.args.length; i++) {
      if (cmd.args[i]._error) {
        return console.log(`There was a problem parsing '${cmd.args[i].name}':\n  ${chalk.red(cmd.args[i]._error.message)}`)
      }
    }

    if (!requiredArgsProvided(mapped, cmd.args)) {
      return console.log(makeHelp(program.name, command, cmd.args, mapped))
    }

    return cmd.run.call(null, mapped)
  }

  const invoke = (command, args) => {
    // Invoke another command with the given args array.
    run([].concat(command.split(' '), args || []))
  }

  return {
    command,
    run,
    invoke,

    // Expose for testing.
    __testRefs: {
      commands,
      parseSignature,
      mapArgs,
      applyArgExtras,
      requiredArgsProvided,
      makeHelp,
      makeGeneralHelp
    }
  }
}

module.exports = CLI

},{"chalk":16}],218:[function(require,module,exports){
/*
  Takes a fuzzy string like "two days ago" or "last wednesday"
  and makes it into a useful Interval.
*/

const {
  startOfDay,
  endOfDay,
  addDays,
  differenceInDays,
  startOfWeek,
  endOfWeek,
  addWeeks,
  startOfMonth,
  endOfMonth,
  addMonths,
  startOfYear,
  endOfYear,
  addYears
} = require('date-fns')

const parseDate = require('./parse-date')

module.exports = function (string, now = new Date()) {
  let start
  let end
  let unit
  let modifier

  const parsed = parseDate(string)
  if (parsed) {
    start = startOfDay(parsed)
    end = endOfDay(parsed)
    unit = 'day'
    modifier = differenceInDays(start, now)
  } else {
    let parts = string.toLowerCase().split(/\s+/)

    if (['now', 'today'].includes(parts[0])) {
      unit = 'day'
      modifier = 0
      start = startOfDay(now)
      end = endOfDay(now)
    }

    if (parts[0] === 'yesterday') {
      unit = 'day'
      modifier = -1
      start = startOfDay(addDays(now, -1))
      end = endOfDay(addDays(now, -1))
    }

    if (!start || !end) {
      let first = parts[0]
      unit = parts[1]
      if (first === 'this') {
        modifier = 0
      } else if (first === 'last') {
        modifier = -1
      } else if (first === 'next') {
        modifier = 1
      } else if (numbers.includes(first)) {
        modifier = -numbers.indexOf(first)
      } else if (weekdays.includes(first) || months.includes(first)) {
        modifier = -1
      } else if (parseInt(first)) {
        modifier = -parseInt(first) || 0
      } else {
        unit = parts[0]
      }

      unit = unit.replace(/[s|ies]$/, '')

      if (!(modifier === 0 && parts[2] === 'ago')) {
        if (unit === 'day') {
          start = startOfDay(addDays(now, modifier))
          end = endOfDay(addDays(now, modifier))
        } else if (unit === 'week') {
          start = startOfWeek(addWeeks(now, modifier))
          end = endOfWeek(addWeeks(now, modifier))
        } else if (unit === 'month') {
          start = startOfMonth(addMonths(now, modifier))
          end = endOfMonth(addMonths(now, modifier))
        } else if (unit === 'year') {
          start = startOfYear(addYears(now, modifier))
          end = endOfYear(addYears(now, modifier))
        } else if (weekdays.includes(unit)) {
          let dayIndex = weekdays.indexOf(unit)
          start = startOfDay(now)
          while (start.getDay() !== dayIndex) {
            start = addDays(start, modifier)
          }
          end = endOfDay(start)
        } else if (months.includes(unit)) {
          let monthIndex = months.indexOf(unit)
          start = startOfMonth(now)
          while (start.getMonth() !== monthIndex) {
            start = addMonths(start, modifier)
          }
          end = endOfMonth(start)
        }
      }
    }
  }

  return {
    modifier () {
      return modifier || 0
    },
    unit () {
      return unit || '???'
    },
    interval () {
      return { start, end }
    }
  }
}

const numbers = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
  'twenty'
]

const months = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december'
]

const weekdays = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
]

},{"./parse-date":222,"date-fns":92}],219:[function(require,module,exports){
const loaders = {
  braille: ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'],
  spinner: ['|', '/', '-', '\\'],
  transfer: [
    '[-------]',
    '[>------]',
    '[<>-----]',
    '[-<>----]',
    '[--<>---]',
    '[---<>--]',
    '[----<>-]',
    '[-----<>]',
    '[------<]'
  ],
  tris: ['◢', '◣', '◤', '◥']
}

module.exports = function ({ text = 'Loading...', animation = 'braille', stopText, fps = 12 } = {}) {
  const chalk = require('chalk')
  const logUpdate = require('log-update')

  let interval
  let frames = loaders[animation]
  let i = 0

  return {
    start (startText = text) {
      if (!interval) {
        i = 0
        console.log()
        interval = setInterval(() => {
          logUpdate(chalk.yellow(frames[i]) + ' ' + startText)
          i = (i + 1) % frames.length
        }, 1000 / fps)
      }
      return this
    },
    stop (stopText) {
      clearInterval(interval)
      interval = null
      i = 0

      if (stopText) {
        logUpdate(stopText)
      }
    }
  }
}

},{"chalk":16,"log-update":188}],220:[function(require,module,exports){
(function (__dirname){
// Loads a random line from a file of newline-separated strings.

module.exports = function (what, opts = {}) {
  const fs = require('fs')
  const path = require('path')
  const fileName = what.replace(' ', '-')

  try {
    const contents = fs.readFileSync(path.join(__dirname, 'messages', fileName), 'utf8')
    const lines = contents.split('\n')

    return lines[Math.round(Math.random() * (lines.length - 1))]
  } catch (err) {
    return opts.default || 'No messages for ' + what + ' (' + err.message + ')'
  }
}

}).call(this,require("path").join(__dirname,"utils","message-for"))
},{"fs":undefined,"path":undefined}],221:[function(require,module,exports){
// Migrate punchfiles from one format to another.

// const schemas = require('./migrator-schemas.js')

module.exports = function (config) {
  function V1toV2 (obj) {
    // Add created
    let newCreated

    if (obj.punches[0]) {
      newCreated = obj.punches[0].in
    }

    return {
      created: newCreated,
      updated: obj.updated,
      punches: obj.punches.map(punch => {
        return {
          project: punch.project,
          in: punch.in,
          out: punch.out || null,
          rewind: punch.rewind,
          comments: punch.comment != null ? [punch.comment] : []
        }
      })
    }
  }

  function V2toV3 (obj) {
    return {
      version: 3,
      created: obj.created,
      updated: obj.updated,
      punches: obj.punches.map(punch => {
        return {
          project: punch.project,
          in: punch.in,
          out: punch.out || null,
          rate: config.projects[punch.project]
            ? config.projects[punch.project].hourlyRate || 0.0
            : 0.0,
          comments: punch.comments
            .filter(c => typeof c === 'string')
            .map(c => ({
              timestamp: punch.out || Date.now(),
              comment: c
            }))
        }
      })
    }
  }

  function pass (obj) {
    return obj
  }

  // Make sure the objects conform to the version they say they are.

  function conformToV1 (obj) {
    return obj
  }

  function conformToV2 (obj) {
    // Make sure punch comments don't have nulls
    obj.punches = obj.punches.map(punch => {
      punch.comments = punch.comments.filter(c => c != null)
      return punch
    })

    return obj
  }

  function conformToV3 (obj) {
    return obj
  }

  // Migration paths from one version to another.
  // Invalid conversions will simply return the unaltered object
  const migrations = [
    [[1, 1], [pass, conformToV1]],
    [[1, 2], [V1toV2]],
    [[1, 3], [V1toV2, V2toV3]],

    [[2, 1], [pass, conformToV2]],
    [[2, 2], [pass, conformToV2]],
    [[2, 3], [V2toV3, conformToV3]],

    [[3, 1], [pass, conformToV3]],
    [[3, 2], [pass, conformToV3]],
    [[3, 3], [pass, conformToV3]]
  ]

  function getPunchFileVersion (obj) {
    if (obj.version === 3) {
      return 3
    }

    if (obj.created && obj.updated) {
      return 2
    }

    if (obj.updated && !obj.created) {
      return 1
    }
  }

  function migrate (from, to, file) {
    let migration = migrations.find(m => {
      let [versionFrom, versionTo] = m[0]
      return versionFrom === from && versionTo === to
    })

    let pipeline = migration[1]

    let migrated = file

    pipeline.forEach(func => {
      migrated = func(migrated)
    })

    return migrated
  }

  return { migrate, getPunchFileVersion }
}

},{}],222:[function(require,module,exports){
module.exports = function (str, today = new Date()) {
  // Parses dates in format MM/DD/YYYY or YYYY/MM/DD format
  // Accepts any combination of slash, dash or period as delimiters
  const parts = str.match(/(\d+)[-/.](\d+)[-/.](\d+)/)
  if (parts) {
    let year, month, day

    if (parts[1].length === 4) {
      // Assume YYYY/MM/DD format
      year = Number(parts[1])
      month = Number(parts[2])
      day = Number(parts[3])
    } else if (parts[3].length === 4) {
      // Assume MM/DD/YYYY format
      year = Number(parts[3])
      month = Number(parts[1])
      day = Number(parts[2])
    } else if (parts[3].length === 2) {
      // Year should be relative to current century.
      // If year is after the current year, fall back to last century.
      let centuryBase = Math.trunc(today.getFullYear() / 100) * 100
      year = centuryBase + Number(parts[3])
      month = Number(parts[1])
      day = Number(parts[2])
      if (year > today.getFullYear()) {
        year -= 100
      }
    } else {
      return null
    }

    return new Date(year, month - 1, day)
  } else {
    return null
  }
}

},{}],223:[function(require,module,exports){
const parseDate = require('./parse-date')

module.exports = function (str) {
  if (str.indexOf('@') === -1) {
    throw new Error('Datetime string should be in the format DATE@TIME[AM/PM]')
  }

  const [dateString, timeString] = str.split('@').map(s => s.trim())

  const date = parseDate(dateString)
  if (!date) {
    throw new Error('Failed to parse date part of datetime string')
  }

  // Date is parsed. Figure out time.
  let timePattern = /^(\d+)[:](\d+)[:]?(\d*)\s*(.*)$/

  let hours
  let minutes
  let seconds
  let meridian

  if (timePattern.test(timeString.trim())) {
    let parts = timeString.trim().match(timePattern)
    hours = Number(parts[1])
    minutes = Number(parts[2])
    seconds = Number(parts[3])
    meridian = parts[4]
  } else {
    throw new Error('Time is not in a compatible format: use either 12-hour with AM/PM or 24-hour format for time')
  }

  if (meridian && meridian.toUpperCase() === 'PM') {
    if (hours <= 12) {
      hours += 12
    } else {
      throw new Error('Hours should not be greater than 12 when PM is present.')
    }
  }
  date.setHours(hours, minutes, seconds)

  return date
}

},{"./parse-date":222}],224:[function(require,module,exports){
module.exports = function (p) {
  const path = require('path')
  const os = require('os')

  // Resolve ~ paths
  if (p[0] === '~') {
    // ~/path -> /home/user/path
    return path.join(os.homedir(), p.slice(1))
  } else {
    return path.resolve(p)
  }
}

},{"os":undefined,"path":undefined}],225:[function(require,module,exports){
/**
 * Sort factory functions. Intended to be passed in to Array.sort()
 */

exports.descendingBy = function (property) {
  if (typeof property === 'function') {
    return function (a, b) {
      return property(a) > property(b) ? -1 : 1
    }
  } else if (typeof property === 'string') {
    return function (a, b) {
      return a[property] > b[property] ? -1 : 1
    }
  } else {
    throw new Error('Property must be either a string or a function. Received ' + typeof property)
  }
}

exports.ascendingBy = function (property) {
  if (typeof property === 'function') {
    return function (a, b) {
      return property(a) < property(b) ? -1 : 1
    }
  } else if (typeof property === 'string') {
    return function (a, b) {
      return a[property] < b[property] ? -1 : 1
    }
  } else {
    throw new Error('Property must be either a string or a function. Received ' + typeof property)
  }
}

},{}]},{},[13]);
