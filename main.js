#!/usr/bin/env node

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

const config = require('./config')()
bench.mark('config loaded')

const Storage = require('./storage')(config)
const Punch = require('./punch/punch')(config, Storage)
const Syncer = require('./sync/syncer')
const Invoicer = require('./invoicing/invoicer')
const Logger = require('./logging/log')

bench.mark('modules loaded')

const resolvePath = require('./utils/resolve-path')
const { ascendingBy } = require('./utils/sort-factories')

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

// const getMessageFor = (file) => {
//   // Returns a random message from the given file.
//   // Assumes the file is a JSON file containing an array of strings in the resources/messages/ folder.
//   try {
//     const options = require('./resources/messages/' + file + '.json')
//     const i = Math.round(Math.random() * options.length - 1)
//     console.log(options, i)
//     return options[i]
//   } catch (err) {
//     return 'BLORK'
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
  run: async function (args) {
    const format = require('date-fns/format')
    const current = await Punch.current()

    if (current) {
      console.log(`You're already punched in on ${getLabelFor(current.project)}! Punch out first.`)
    } else {
      const punch = new Punch({ project: args.project })
      punch.save()

      const time = format(new Date(), config.timeFormat)
      console.log(`Punched in on ${getLabelFor(args.project)} at ${time}.`)

      handleSync()
    }
  }
})

command({
  signature: 'out [*comment]',
  description: 'stop tracking time and record an optional description of tasks completed',
  run: async function (args) {
    const current = await Punch.current()

    if (current) {
      const formatDate = require('date-fns/format')
      const formatDuration = require('./format/duration')
      const formatCurrency = require('./format/currency')

      current.punchOut(args.comment, { autosave: true })

      const label = getLabelFor(current.project)
      const duration = formatDuration(current.duration())
      const time = formatDate(new Date(), config.timeFormat)
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
  signature: 'comment <*comment>',
  description: 'add a comment to remember what you worked on',
  run: async function (args) {
    const current = await Punch.current()

    if (!current) {
      const latest = await Punch.latest()

      let label = getLabelFor(latest.project)
      let inTime = latest.in
      let outTime = latest.out
      let date = Date.now()

      let format = ''

      if (inTime.day !== date || outTime.day !== date) {
        format = config.dateTimeFormat
      } else {
        format = config.timeFormat
      }

      inTime = inTime.toFormat(format)
      outTime = outTime.toFormat(format)

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
  signature: 'create <project> <timeIn> <timeOut> [*comment]',
  description: 'create a punch',
  run: function (args) {
    const formatDuration = require('./format/duration')
    const formatCurrency = require('./format/currency')
    const formatDate = require('date-fns/format')

    const { project, timeIn, timeOut, comment } = args

    let punchIn, punchOut
    // Parses a time in this format: 'MM-DD-YYYY@hh:mmA'
    const timeRegex = /(\d+)[-/](\d+)[-/](\d+)@(\d+):(\d+)\s*(.*)/
    const parseTime = timeString => {
      let parts = timeString.match(timeRegex).slice(1, 7)
      let meridian = parts.pop().toUpperCase()
      parts = parts.map(Number)

      let time = new Date(parts[2], parts[0] - 1, parts[1], parts[3], parts[4])
      if (meridian === 'PM') {
        require('date-fns/add_hours')(time, 12)
      }
      return time
    }

    if (!timeRegex.test(timeIn) || !timeRegex.test(timeOut)) {
      return console.log('Please enter dates formatted as: mm-dd-yyyy@hours:minutesAM')
    }

    punchIn = parseTime(timeIn)
    punchOut = parseTime(timeOut)

    const duration = punchOut.getTime() - punchIn.getTime()
    const projectData = config.projects[project]
    let pay
    if (projectData && projectData.hourlyRate) {
      pay = formatCurrency(duration / 3600000 * projectData.hourlyRate)
    } else {
      pay = 'N/A'
    }

    let str = ''
    str += `   Project: ${getLabelFor(project)}\n`
    str += `   Time In: ${formatDate(punchIn, 'dddd, MMM Do YYYY [@] h:mma')}\n`
    str += `  Time Out: ${formatDate(punchOut, 'dddd, MMM Do YYYY [@] h:mma')}\n`
    str += `  Duration: ${formatDuration(duration)}\n`
    str += `       Pay: ${pay}\n`

    if (comment) {
      str += `   Comment: ${comment}\n\n`
    }

    str += '\nCreate this punch?'

    if (confirm(str)) {
      const punch = new Punch({
        project,
        in: punchIn.getTime(),
        out: punchOut.getTime(),
        comments: [comment]
      })
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
  signature: 'now',
  description: 'show the status of the current session',
  run: async function () {
    const active = await Punch.current()

    if (active) {
      const formatDate = require('date-fns/format')
      const formatDuration = require('./format/duration')
      const formatCurrency = require('./format/currency')

      const punchedIn = formatDate(active.in, config.timeFormat)
      const duration = formatDuration(active.duration())
      const pay = active.pay()

      let str = `You've been working on ${getLabelFor(active.project)} since ${punchedIn} (${duration} ago).`

      if (active.rate) {
        str += ` Earned ${formatCurrency(pay)}.`
      }

      console.log(str)
    } else {
      console.log('No current session.')
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
  signature: 'project <name>',
  description: 'get statistics for a specific project',
  run: function (args) {
    invoke(`projects ${args.name || ''}`)
  }
})

command({
  signature: 'projects [names...]',
  description: 'show statistics for all projects in your config file',
  run: async function (args) {
    const { projectSummary } = require('./logging/printing')
    const formatSummary = require('./format/projsummary')

    let names = args.names || Object.keys(config.projects)

    const allPunches = await Punch.all().sort(ascendingBy('in'))
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

    summaries
      .sort(ascendingBy('fullName'))
      .forEach(s => console.log(projectSummary(formatSummary(s))))
  }
})

command({
  signature: 'log [*when]',
  description: 'show a summary of punches for a given period ("last month", "this week", "two days ago", etc)',
  options: [{
    signature: '--project, -p <name>',
    description: 'show only punches for this project'
  }],
  run: function (args) {
    const fuzzyParse = require('./utils/fuzzy-parse')
    const interval = fuzzyParse(args.when || 'today').interval()

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
  run: async function (args) {
    return console.log('Not re-implemented yet')

    const active = await Punch.current()

    if (active && active.project === args.project) {
      return console.log(`You're currently punched in on ${getLabelFor(active.project)}. Punch out before creating an invoice.`)
    }

    const { labelTable } = require('./logging/printing')
    let { project, startDate, endDate, outputFile } = args
    const projectData = config.projects[project]
    if (!projectData) {
      const chalk = require('chalk')
      console.log(`Can't invoice for ${chalk.red(project)} because your config file contains no information for that project.`)
      console.log(`You can run ${chalk.cyan('punch config')} to open your config file to add the project info.`)
      return
    }

    if (!projectData.hourlyRate) {
      console.log(`${getLabelFor(project)} has no hourly rate set}`)
      return
    }

    // startDate = DateTime.fromFormat(startDate, 'MM-DD-YYYY').startOf('day')
    // endDate = DateTime.fromFormat(endDate, 'MM-DD-YYYY').endOf('day')

    let format
    let ext = require('path').extname(outputFile)

    switch (ext.toLowerCase()) {
      case '.pdf':
        format = 'PDF'
        break
      case '.html':
        format = 'HTML'
        break
      case '.txt':
      case '.md':
        return console.log(`Exporting invoices as ${ext.toLowerCase()} is not yet supported. Use HTML or PDF.`)
      default:
        return console.log(`Can't export to file with an extension of ${ext}`)
    }

    let str = '\n'

    str += labelTable([
      { label: 'Project', value: projectData.name || project },
      { label: 'Start Date', value: startDate.format('dddd, MMM Do YYYY') },
      { label: 'End Date', value: endDate.format('dddd, MMM Do YYYY') },
      { label: 'Invoice Format', value: format },
      { label: 'Output To', value: resolvePath(outputFile) }
    ])
    console.log(str)

    if (confirm('Create invoice?')) {
      const invoicer = Invoicer(config, flags)

      const punches = await Punch.select(p =>
        p.project === project &&
        p.in.valueOf() >= startDate.valueOf() &&
        p.in.valueOf() <= endDate.valueOf())

      const data = {
        startDate,
        endDate,
        punches,
        project: projectData,
        user: config.user,
        output: {
          path: resolvePath(outputFile)
        }
      }

      invoicer.generate(data, format)
    }
  }
})

command({
  signature: 'sync',
  description: 'synchronize with any providers in your config file',
  run: function () {
    Syncer(config, flags).sync()
  }
})

command({
  signature: 'config [editor]',
  description: 'open config file in editor - uses EDITOR env var unless an editor command is specified.',
  run: function (args) {
    const editor = args.editor || process.env.EDITOR

    if (!editor) {
      return console.log(require('chalk').red('No editor specified and no EDITOR variable available. Please specify an editor to use: punch config <editor>'))
    }

    const spawn = require('child_process').spawn
    const configPath = config.configPath

    // console.log(editor, configPath)

    spawn(editor, [configPath], { stdio: 'inherit' })
  }
})

command({
  signature: 'edit [date] [editor]',
  description: 'edit punchfile for the given date - uses EDITOR env var unless and editor command is specified',
  hidden: true,
  run: function (args) {
    const editor = args.editor || process.env.EDITOR
    const date = moment(args.date || moment(), 'MM/DD/YYYY').startOf('day')
    const fs = require('fs')

    if (!editor) {
      return console.log(require('chalk').red('No editor specified and no EDITOR variable available.\nPlease specify an editor to use: punch edit <date> <editor>'))
    }

    const y = date.year()
    const m = date.month() + 1
    const d = date.date()

    const filename = 'punch_' + y + '_' + m + '_' + d + '.json'
    const file = require('path').join(config.punchPath, filename)

    if (!fs.existsSync(file)) {
      console.warn(require('chalk').red('File doesn\'t exist.'))
    }

    require('child_process').spawn(editor, [file], { stdio: 'inherit' })
  }
})

command({
  signature: 'timestamp <time>',
  description: 'get a millisecond timestamp for a given time (mm/dd/yyyy@hh:mm:ss)',
  hidden: true,
  run: function (args) {
    const date = moment(args.time, 'MM/DD/YYYY@hh:mm:ssa')
    console.log(date.valueOf() + require('chalk').grey(' << ') + date.format('MMM Do YYYY, hh:mm:ssa'))
  }
})

command({
  signature: 'migrate <to>',
  description: 'migrate any punchfiles with older schemas than the specified version to the specified version',
  hidden: true,
  arguments: [{
    name: 'to',
    description: 'target schema version number',
    parse: val => parseInt(val)
  }],
  run: function (args) {
    const version = parseInt(args.to)
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
