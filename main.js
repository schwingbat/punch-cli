#!/usr/bin/env node

// const heapdump = require('heapdump')
// heapdump.writeSnapshot()

const resolvePath = require('./utils/resolve-path')
const { ascendingBy } = require('./utils/sort-factories')
const parseDate = require('./utils/parse-date')
const parseDateTime = require('./utils/parse-datetime')
const CLI = require('./utils/cli.js')

const { command, run, invoke } = CLI({
  name: 'punch',
  version: require('./package.json').version
})

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
// const Syncer = require('./sync/syncer')

// const { autoSync } = config.sync

/* ========================= *\
||           Utils           ||
\* ========================= */

const getLabelFor = (name) => {
  return config.projects[name]
    ? config.projects[name].name
    : name
}

const getMessageFor = require('./utils/message-for')

const confirm = (question) => {
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
  // if (autoSync && !flags.NO_SYNC) {
  //   return new Syncer(config, Punch).sync()
  // }
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
    const current = await Punch.current()

    if (current) {
      console.log(`You're already punched in on ${getLabelFor(current.project)}! Punch out first.`)
    } else {
      const punch = new Punch({ project: args.project })
      punch.save()

      const fs = require('fs')
      const path = require('path')
      fs.writeFileSync(path.join(path.dirname(config.configPath), 'current'), getLabelFor(args.project))

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
    parse: (words) => words.join(' ')
  }],
  options: [{
    name: 'git-commit',
    short: 'c',
    description: 'simultaneously add a git commit with the comment as the message',
    type: 'boolean'
  }, {
    name: 'git-add',
    short: 'a',
    description: 'also run "git add <value>" before commit when --git-commit is true',
    type: 'string'
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

      const fs = require('fs')
      const path = require('path')
      fs.writeFileSync(path.join(path.dirname(config.configPath), 'current'), '')

      if (args.options['git-commit']) {
        const { exec, spawn } = require('child_process')

        if (args.options['git-add']) {
          exec(`git add ${args.options['git-add']}`, (err, stdout, stderr) => {
            if (err || stderr) {
              return console.error(err || stderr)
            }
            console.log(stdout)
            spawn('git', ['commit', '-m', args.comment], { stdio: 'inherit' })
          })
        } else {
          spawn('git', ['commit', '-m', args.comment], { stdio: 'inherit' })
        }
      }

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
    parse: (words) => words.join(' ')
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
  options: [{
    name: 'minimal',
    short: 'm',
    description: 'print a stripped down output for scripting use',
    type: 'boolean'
  }, {
    name: 'project-only',
    short: 'p',
    description: 'print only the project name',
    type: 'boolean'
  }],
  run: async function (args) {
    const current = await Punch.current()
    const formatDuration = require('./format/duration')

    if (args.options.minimal) {
      if (current) {
        if (args.options['project-only']) {
          console.log(getLabelFor(current.project))
        } else {
          console.log(`${getLabelFor(current.project)}: ${formatDuration(current.duration())}`)
        }
      }
    } else {
      if (current) {
        // Print current session stats.
        // Project name, current pay, time worked,
      } else {
        let message = "You're not punched in."

        const latest = await Punch.latest()
        if (latest) {
          const label = getLabelFor(latest.project)
          const timeDiff = formatDuration(Date.now() - latest.out, { long: true })
          message += ` You punched out of ${label} ${timeDiff} ago.`
        }

        console.log(message)
      }
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
    parse: (words) => words.join(' ')
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
    name: 'project',
    short: 'p',
    type: 'string',
    description: 'show only punches for a given project'
  }],
  run: function (args) {
    const fuzzyParse = require('./utils/fuzzy-parse')
    const interval = fuzzyParse(args.when).interval()

    if (interval) {
      require('./logging/log')(config, Punch).forInterval(interval, args.options.project)
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

    console.log(args.outputFile)

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

      const invoicer = require('./invoicing/invoicer')(config, flags)
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
        throw err
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
    const Syncer = require('./sync/syncer')
    const syncer = new Syncer(config, Punch)

    const sync = async (service) => {
      loader.start(`Syncing with ${service}...`)
      const results = await syncer.sync(service)

      let report = chalk.green('✓') + ` Synced with ${service}  `
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

    Promise.all(config.sync.services.map(s => sync(s.name)))
      .then(() => {
        // console.log('done syncing')
      })
      .catch(err => {
        console.error(err)
      })
  }
})

command({
  signature: 'config',
  description: 'open config file in editor - uses EDITOR env var unless an editor flag is specified.',
  options: [{
    name: 'editor',
    short: 'e',
    description: 'editor command (vim, code, etc.)',
    type: 'string',
    default: function () {
      return process.env.VISUAL ||
             process.env.EDITOR ||
             (/^win/.test(process.platform) ? 'notepad' : 'vim')
    }
  }],
  run: function (args) {
    require('child_process')
      .spawn(args.options.editor, [config.configPath], { stdio: 'inherit' })
  }
})

command({
  signature: 'edit [date]',
  description: 'edit punchfile for the given date - uses EDITOR env var unless an editor is specified',
  arguments: [{
    name: 'date',
    description: 'date for the desired punchfile (MM-DD-YYYY format)',
    parse: parseDate,
    default: () => new Date()
  }],
  options: [{
    name: 'editor',
    short: 'e',
    type: 'string',
    default: () => process.env.VISUAL ||
                   process.env.EDITOR ||
                   (/^win/.test(process.platform) ? 'notepad' : 'vim')
  }],
  hidden: true,
  run: function (args) {
    const { date } = args

    const y = date.getFullYear()
    const m = date.getMonth() + 1
    const d = date.getDate()
    const filename = `punch_${y}_${m}_${d}.json`
    const file = require('path').join(config.punchPath, filename)

    if (!require('fs').existsSync(file)) {
      return console.log(require('chalk').red('File doesn\'t exist.'))
    }

    require('child_process').spawn(args.options.editor, [file], { stdio: 'inherit' })
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
    const migrator = require('./utils/migrator')(config)
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

      const fileVersion = migrator.getPunchFileVersion(file)
      const migrated = migrator.migrate(fileVersion, version, file)

      migrated.updated = Date.now()

      fs.writeFileSync(filePath, JSON.stringify(migrated, null, 2))
      console.log(`Converted ${fileName} from version ${fileVersion} to version ${Math.max(fileVersion, version)}`)
    })
  }
})

run(ARGS)

bench.mark('parsed and run')
bench.printAll()
