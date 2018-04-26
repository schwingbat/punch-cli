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

// Dependencies
const path = require('path')
const readline = require('readline-sync')
const chalk = require('chalk')
const logUpdate = require('log-update')

const config = require('./config')()
const Storage = require('./storage')(config)
const Punch = require('./punch/punch')(config, Storage)
const Syncer = require('./sync/syncer')
const Invoicer = require('./invoicing/invoicer')
const Logger = require('./logging/log')

const { Duration, DateTime } = require('luxon')
const resolvePath = require('./utils/resolve-path')
const fuzzyParse = require('./utils/fuzzy-parse')

const { ascendingBy } = require('./utils/sort-factories')

// Formatting
const summaryfmt = require('./format/projsummary')
const print = require('./logging/printing')
const currency = require('./format/currency')

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
    response = readline.question(`${question} [y/n] `).toLowerCase().trim()

    if (response === 'y' || response === 'yes') {
      return true
    } else if (response === 'n' || response === 'no') {
      return false
    } else {
      console.log('Please enter: y, n, yes or no.')
    }
  }
}

const handleSync = () => {
  if (autoSync && !flags.NO_SYNC) {
    const syncer = new Syncer(config, Punch)
    syncer.sync()
  }
}

/* ========================= *\
||       Parse/Dispatch      ||
\* ========================= */

command({
  signature: 'in <project>',
  description: 'start tracking time on a project',
  run: async function (args) {
    const current = await Punch.current()

    if (current) {
      console.log(`You're already punched in on ${getLabelFor(current.project)}! Punch out first.`)
    } else {
      const punch = new Punch({ project: args.project })
      punch.save()

      const time = DateTime.local().toFormat(config.timeFormat)
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
      current.punchOut(args.comment, { autosave: true })

      const label = getLabelFor(current.project)
      const time = DateTime.local().toFormat(config.timeFormat)
      const duration = Duration.fromMillis(current.out - current.in)
      const pay = duration.as('hours') * current.rate

      let str = `Punched out on ${label} at ${time}. Worked for ${duration}`
      if (pay > 0) {
        str += ` and earned ${currency(pay)}`
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
    const { project, timeIn, timeOut, comment } = args

    let punchIn, punchOut
    try {
      punchIn = moment(timeIn, 'MM-DD-YYYY@hh:mmA')
      punchOut = moment(timeOut, 'MM-DD-YYYY@hh:mmA')
    } catch (err) {
      console.log(`Please enter dates formatted as 'mm-dd-yyyy@hours:minutesAM' (err: ${err})`)
    }

    if (!punchIn.isValid() || !punchOut.isValid()) {
      return console.log('Please enter dates formatted as \'mm-dd-yyyy@hours:minutesAM\'')
    }

    const proj = config.projects[project]
    const duration = new Duration(punchOut - punchIn)
    let pay
    if (proj && proj.hourlyRate) {
      pay = currency(duration.totalHours() * proj.hourlyRate)
    } else {
      pay = 'N/A'
    }

    let str = ''

    str += `   Project: ${getLabelFor(project)}\n`
    str += `   Time In: ${punchIn.format('dddd, MMM Do YYYY [@] h:mma')}\n`
    str += `  Time Out: ${punchOut.format('dddd, MMM Do YYYY [@] h:mma')}\n`
    str += `  Duration: ${duration}\n`
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
  // disabled: true,
  run: async function (args) {
    const { project } = args
    const label = getLabelFor(project)
    const punches = await Punch.select(p => p.project === project)

    if (punches.length > 0) {
      const totalTime = punches.reduce((sum, p) =>
        sum + ((p.out || Date.now()) - p.in), 0)

      // Confirm and commit changes to files.
      const confirmString = `Purging ${label} would delete ${punches.length} punch${punches.length === 1 ? '' : 'es'} totalling ${new Duration(totalTime)}.`

      console.log(confirmString)

      let response

      while (response !== label) {
        response = readline.question(`Type in '${label}' if you're REALLY sure, or 'n' to cancel: `).toLowerCase().trim()

        if (response === label) {
          // Delete
          punches.forEach(punch => {
            punch._file.punches = punch._file.punches.filter(p => p !== punch)
            punch._file.save()
          })
          console.log(`Purged ${punches.length} punches.`)
        } else if (response === 'n') {
          return false
        }
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
      const duration = Duration.fromMillis(Date.now() - active.in)
      const pay = duration.as('hours') * active.rate
      const punchedIn = DateTime.fromMillis(active.timestamp).toFormat(config.timeFormat)

      let str = `You've been working on ${getLabelFor(active.project)} since ${punchedIn} (${duration} ago).`

      if (active.rate) {
        str += ` Earned ${currency(pay)}.`
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
    const clock = require('./utils/big-clock')({
      style: 'clockBlockDots',
      letterSpacing: 1
    })

    if (active) {
      const project = config.projects[active.project]
      const label = project && project.name ? project.name : active.project
      const rate = project && project.hourlyRate ? project.hourlyRate : 0

      const update = () => {
        let duration = new Duration(Date.now() - active.in)
        let pay = duration.totalHours() * rate

        let working = `Working on ${label}`
        let money = currency(pay)
        let numbers = clock.display(duration.toClockString())
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
    let { names } = args

    if (!names) {
      names = Object.keys(config.projects)
    }

    const allPunches = await Punch.all().sort(ascendingBy('in'))

    const summaries = []

    for (let i = 0; i < names.length; i++) {
      const project = names[i]
      const punches = allPunches.filter(p => p.project === project)

      if (punches.length > 0) {
        let firstPunch = punches[0]
        let latestPunch = punches[punches.length - 1]

        const projectData = config.projects[project]
        const fullName = projectData
          ? projectData.name
          : project
        const totalTime = punches.reduce(
          (sum, punch) =>
            sum + ((punch.out || Date.now()) - punch.in - (punch.rewind || 0)),
          0)
        const totalHours = (totalTime / 3600000)
        const totalPay = projectData && projectData.hourlyRate
          ? totalHours * projectData.hourlyRate
          : 0
        const hourlyRate = projectData && projectData.hourlyRate
          ? projectData.hourlyRate
          : 0

        summaries.push({
          fullName,
          totalTime,
          totalHours,
          totalPay,
          hourlyRate,
          firstPunch,
          latestPunch,
          totalPunches: punches.length
        })
      }
    }

    summaries
      .sort((a, b) => a.fullName > b.fullName) // Sort alphabetically
      .forEach(s => console.log(print.projectSummary(summaryfmt(s))))
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
    const active = await Punch.current()

    if (active && active.project === args.project) {
      return console.log(`You're currently punched in on ${getLabelFor(active.project)}. Punch out before creating an invoice.`)
    }

    let { project, startDate, endDate, outputFile } = args
    const projectData = config.projects[project]
    if (!projectData) {
      console.log(`Can't invoice for ${chalk.red(project)} because your config file contains no information for that project.`)
      console.log(`You can run ${chalk.cyan('punch config')} to open your config file to add the project info.`)
      return
    }

    if (!projectData.hourlyRate) {
      console.log(`${getLabelFor(project)} has no hourly rate set}`)
      return
    }

    startDate = DateTime.fromFormat(startDate, 'MM-DD-YYYY').startOf('day')
    endDate = DateTime.fromFormat(endDate, 'MM-DD-YYYY').endOf('day')

    let format
    let ext = path.extname(outputFile)

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

    str += print.labelTable([
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

      invoicer.create(data, format)
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
      return console.log(chalk.red('No editor specified and no EDITOR variable available. Please specify an editor to use: punch config <editor>'))
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
      return console.log(chalk.red('No editor specified and no EDITOR variable available.\nPlease specify an editor to use: punch edit <date> <editor>'))
    }

    const y = date.year()
    const m = date.month() + 1
    const d = date.date()

    const filename = 'punch_' + y + '_' + m + '_' + d + '.json'
    const file = path.join(config.punchPath, filename)

    if (!fs.existsSync(file)) {
      console.warn(chalk.red('File doesn\'t exist.'))
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
    console.log(date.valueOf() + chalk.grey(' << ') + date.format('MMM Do YYYY, hh:mm:ssa'))
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
