#!/usr/bin/env node

global.appRoot = __dirname

const fs = require('fs')
const path = require('path')
const resolvePath = require('./utils/resolve-path')
const { ascendingBy } = require('./utils/sort-factories')
const parseDate = require('./utils/parse-date')
const parseDateTime = require('./utils/parse-datetime')
const CLI = require('./utils/cli.js')
const messageFor = require('./utils/message-for')
const padWithLines = require('./logging/pad-with-lines')
const Loader = require('./utils/loader')
const chalk = require('chalk')

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

const bench = require('./utils/bench')({ disabled: !flags.BENCHMARK })
const config = require('./config')()

bench.mark('config loaded')

const Storage = require('./storage')(config)
const Punch = require('./punch/punch')(config, Storage)

const { autoSync } = config.sync

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

// const questionnaire = (questions) => {
//   const rl = require('readline-sync')

//   for (let i = 0; i < questions.length; i++) {
//     const q = questions[i]
    
//   }
// }

const handleSync = async ({ silent } = {}) => {
  if (autoSync && !flags.NO_SYNC) {
    const Syncer = require('./sync/syncer')
    return new Syncer(config, Punch).syncAll({ silent })
  } else {
    return Promise.resolve()
  }
}

const updateCurrentMarker = (current) => {
  // Updates the ~/.punch/current file
  let label = ''
  if (typeof current === 'string') {
    label = current
  } else if (current instanceof Punch) {
    label = getLabelFor(current.project)
  }

  fs.writeFileSync(path.join(path.dirname(config.configPath), 'current'), label)
}

/* ========================= *\
||       Parse/Dispatch      ||
\* ========================= */

command({
  signature: 'in <project>',
  description: 'start tracking time on a project',
  examples: ['punch in punch-cli',
             'punch in tps-reports'],
  arguments: [{
    name: 'project',
    description: 'name of the project'
  }],
  options: [{
    name: 'time',
    short: 't',
    description: 'time to set as punch in time (defaults to current time)',
    type: parseDateTime 
  }],
  run: async function (args) {
    const loader = Loader()
    loader.start('Punching in...')
    await handleSync({ silent: true })

    const current = await Punch.current()

    if (current) {
      loader.stop(chalk.red('❌') + ` You're already punched in on ${getLabelFor(current.project)}! Punch out first.`)
    } else {
      // Check if project is in config file
      if (config.projects[args.project]) {
        const punch = new Punch({
          project: args.project,
          in: args.options.time
        })
        punch.save()

        updateCurrentMarker(punch)

        // const time = format(new Date(), config.display.timeFormat)
        loader.stop(chalk.green('✔️') + ` Punched in on ${getLabelFor(args.project)}. ${getMessageFor('punched-in', { default: '' })}`)
        handleSync()
      } else {
        loader.stop(`\n${chalk.bold(args.project)} is not a project in your config file. You'll have to add it first.\nEnter '${chalk.bold('punch config')}' to edit your configuration.\n`)
      }
    }
  }
})

command({
  signature: 'out',
  description: 'stop tracking time',
  options: [{
    name: 'comment',
    short: 'c',
    description: 'add a description of what you worked on',
    type: 'string'
  }, {
    name: 'time',
    short: 't',
    description: 'time to set as punch out time (defaults to current time)',
    type: parseDateTime
  }, {
    name: 'no-comment',
    description: 'punch out without warning about a lack of comments',
    type: 'boolean'
  }],
  run: async function (args) {
    const loader = Loader()
    loader.start('Punching out...')
    await handleSync({ silent: true })

    const current = await Punch.current()

    if (current) {
      if (current.comments.length === 0 && args.raw.length === 0 && !args.options['no-comment']) {
        const conf = confirm(`Are you sure you want to punch out with no comment?`)
        if (!conf) {
          return console.log(`Use the --comment or -c flags to add a comment:\n  usage: punch out -c "This is a comment."\n`)
        }
      }

      if (current.comments.length === 0 && !args.options.comment) {
        return console.log(`If you want to add a comment, you still can.\n Use: 'punch comment "this is a comment"'`)
      }
      
      const formatDate = require('date-fns/format')
      const formatDuration = require('./format/duration')
      const formatCurrency = require('./format/currency')

      current.punchOut(args.options.comment, {
        autosave: true,
        time: args.options.time
      })

      const label = getLabelFor(current.project)
      const duration = formatDuration(current.duration())
      const time = formatDate(args.options.time || new Date(), config.display.timeFormat)
      const pay = current.pay()

      let str = `Punched out on ${label} at ${time}. Worked for ${duration}`
      if (pay > 0) {
        str += ` and earned ${formatCurrency(pay)}`
      }
      loader.stop(chalk.green('✔️') + ' ' + str + '.')

      updateCurrentMarker('')
      handleSync()
    } else {
      loader.stop(chalk.yellow('⚠️') + ` You're not punched in!`)
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

    updateCurrentMarker(current)

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
        console.log(`You've been punched in on ${getLabelFor(current.project)} for ${formatDuration(Date.now() - current.in)}.`)
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
  signature: 'create <project>',
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
  }],
  options: [{
    name: 'time-in',
    short: 'i',
    description: 'start time and date (e.g. MM/DD/YYYY@12:00PM)',
    type: parseDateTime
  }, {
    name: 'time-out',
    short: 'o',
    description: 'end time and date',
    type: parseDateTime
  }, {
    name: 'comment',
    short: 'c',
    description: 'a description of what you worked on',
    type: 'string'
  }],
  run: function (args) {
    const formatDuration = require('./format/duration')
    const formatCurrency = require('./format/currency')
    const formatDate = require('date-fns/format')

    const { project } = args
    const timeIn = args.options['time-in']
    const timeOut = args.options['time-out']
    const comment = args.options['comment']

    const duration = timeOut.getTime() - (timeIn || new Date()).getTime()
    let pay
    if (project.hourlyRate) {
      pay = formatCurrency(duration / 3600000 * project.hourlyRate)
    } else {
      pay = 'N/A'
    }

    let str = '\n'
    str += `   Project: ${project.name} (${project.alias})\n`
    str += `   Time In: ${formatDate(timeIn, 'dddd, MMM Do YYYY [@] h:mma')}\n`
    str += `  Time Out: ${formatDate(timeOut, 'dddd, MMM Do YYYY [@] h:mma')}\n`
    str += `  Duration: ${formatDuration(duration)}\n`
    str += `       Pay: ${pay}\n`

    if (comment) {
      str += `   Comment: ${comment}\n\n`
    }

    str += 'Create this punch?'

    if (confirm(str)) {
      const punch = new Punch({
        project: project.alias,
        in: timeIn.getTime(),
        out: timeOut.getTime(),
        rate: project.hourlyRate || 0
      })
      if (args.comment) {
        punch.addComment(comment)
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
  options: [{
    name: 'animate',
    short: 'a',
    type: 'boolean',
    description: 'enable animations for the clock'
  }],
  run: async function (args) {
    const active = await Punch.current()

    if (active) {
      const formatCurrency = require('./format/currency')
      const formatDuration = require('./format/duration')
      const { startOfMonth,
              endOfMonth,
              startOfDay,
              endOfDay } = require('date-fns')
      const logUpdate = require('log-update')
      const printLength = require('./utils/print-length')
      const clock = require('./utils/big-clock')({
        style: 'clock-block',
        letterSpacing: 1,
        animate: !!args.options.animate
      })

      const now = new Date()

      // Get total for month and day
      let monthlyTotal = 0
      let dailyTotal = 0

      // Total daily and monthly amounts.
      // Skip the active punch so we can just add its current pay() value
      // to get correct amounts for daily and monthly earnings.
      const punches = await Punch.select(p => p.in >= startOfMonth(now)
                                           && p.in <= endOfMonth(now)
                                           && p.id !== active.id)

      punches.forEach(p => {
        if (p.in >= startOfDay(now) && p.in <= endOfDay(now)) {
          dailyTotal += p.pay()
        }
        monthlyTotal += p.pay()
      })

      const update = () => {
        const duration = active.duration()
        const activePay = active.pay()
        const numbers = clock.display(formatDuration(duration, { style: 'clock' }))

        let topLine = `Working on ${getLabelFor(active.project)}`
        let bottomLine = ''

        // Don't bother showing money stats for unpaid projects.
        if (activePay > 0) {
          const money = formatCurrency(activePay)
          const numbersLength = printLength(numbers.split('\n')[0])
          const monthly = formatCurrency(monthlyTotal + activePay) + ' this month'
          const daily = formatCurrency(dailyTotal + activePay) + ' today'

          topLine += money.padStart(numbersLength - topLine.length, ' ')
          bottomLine = monthly + daily.padStart(numbersLength - monthly.length, ' ')
        }

        logUpdate('\n' + topLine + '\n' + numbers + bottomLine)
      }

      update()
      setInterval(update, args.options.animate ? 64 : 1000)
    } else {
      console.log(messageFor('not-punched-in'))
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
          description: projectData.description,
          totalTime,
          totalPay,
          hourlyRate,
          firstPunch,
          latestPunch,
          totalPunches: punches.length
        })
      }
    }

    let str = ''

    summaries
      .sort(ascendingBy('fullName'))
      .forEach(s => {
        str += projectSummary(formatSummary(config, s)) + '\n\n'
      })

    console.log(padWithLines(str, 1))
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
  }, {
    name: 'object',
    short: 'o',
    type: 'string',
    description: 'show only punches tagged with a given comment object (e.g. @task:1669)'
  }],
  run: function (args) {
    const fuzzyParse = require('./utils/fuzzy-parse')
    const interval = fuzzyParse(args.when)

    if (interval) {
      require('./logging/log')(config, Punch).forInterval(interval, args.options)
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
  options: [{
    name: 'local',
    short: 'l',
    description: 'generate invoice locally (uses HTTP invoice API by default)',
    type: 'boolean'
  }, {
    name: 'yes',
    short: 'y',
    description: 'generation without confirming details',
    type: 'boolean'
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

    if (args.options.yes || confirm('Create invoice?')) {
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
        }, !!args.options.local)
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
    const Syncer = require('./sync/syncer')
    await new Syncer(config, Punch).syncAll()

    updateCurrentMarker(await Punch.current())
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
    const file = require('path').join(config.punchFilePath, filename)

    if (!require('fs').existsSync(file)) {
      return console.log(require('chalk').red('File doesn\'t exist.'))
    }

    require('child_process').spawn(args.options.editor, [file], { stdio: 'inherit' })
  }
})

command({
  signature: 'timestamp [time]',
  description: 'get a millisecond timestamp for a given time (mm/dd/yyyy@hh:mm:ss)',
  examples: [
    'punch timestamp 6/5/2018@10:31am',
    'punch timestamp'
  ],
  arguments: [{
    name: 'time',
    description: 'datetime string to get a timestamp for',
    parse: parseDateTime,
    default: () => new Date()
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
  examples: [
    'punch migrate 3'
  ],
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
    const dir = fs.readdirSync(config.punchFilePath)

    dir.forEach(fileName => {
      const filePath = path.join(config.punchFilePath, fileName)
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

command({
  signature: 'alias-rename <from> <to>',
  description: 'move all punches with project alias <from> to <to>',
  //hidden: true,
  examples: [
    'punch alias-rename oldname newname'
  ],
  arguments: [{
    name: 'from',
    description: 'project alias to target'
  }, {
    name: 'to',
    description: 'project alias to rename to'
  }],
  run: async function (args) {
    const { from, to } = args

    const punches = await Punch.select(p => p.project === from)
    punches.forEach(punch => {
      punch.project = to
      punch.update()
      punch.save()
    })

    console.log(`${punches.length} punches updated`)
  }
})

command({
  signature: 'comment-object-rename <from> <to>',
  description: 'rename comment objects with name <from> to name <to>',
  //hidden: true,
  examples: [
    'punch alias-rename task vsts'
  ],
  arguments: [{
    name: 'from',
    description: 'starting name (e.g. "task" for @task:1500)'
  }, {
    name: 'to',
    description: 'ending name (e.g. "vsts" to get @vsts:1500)'
  }],
  run: async function (args) {
    const { from, to } = args

    const punches = await Punch.select(p => {
      for (let c = 0; c < p.comments.length; c++) {
        for (let o = 0; o < p.comments[c].objects.length; o++) {
          if (p.comments[c].objects[o].key === from) {
            return true
          }
        }
      }
    })

    punches.forEach(punch => {
      punch.comments.forEach(comment => {
        comment.objects.forEach(object => {
          if (object.key === from) {
            object.key = to
          }
        })
      })
      punch.update()
      punch.save()
    })

    console.log(`${punches.length} punches updated`)
  }
})

command({
  signature: 'export',
  description: 'exports punch data',
  hidden: true,
  examples: [],
  options: [{
    name: 'start',
    short: 's',
    description: 'start date for punch selection',
    type: parseDateTime
  }, {
    name: 'end',
    short: 'e',
    description: 'end date for punch selection',
    type: parseDateTime
  }, {
    name: 'project',
    short: 'p',
    description: 'project name for punch selection',
    type: 'string'
  }, {
    name: 'tag',
    short: 't',
    description: 'comment tag values for punch selection',
    type: 'string'
  }, {
    name: 'format',
    short: 'f',
    description: 'formatting style of punches (e.g. tfs-tracker)',
    type: 'string'
  }, {
    name: 'destination',
    short: 'd',
    description: 'file path to save to (prints to console by default)',
    type: 'string'
  }],
  run: async function(args) {
    const { start, end, project, tag, format, destination } = args.options
    const resolvePath = require('./utils/resolve-path')
    const path = require('path')
    const chalk = require('chalk')

    let formatter
    let formatterPath = path.join(config.punchPath, 'formatters', 'export', format + '.js')
    try {
      formatter = require(formatterPath)
    } catch (err) {
      console.log(chalk.red(`\nNo formatter for '${format}'`))
      console.log(`You can create ${chalk.green(formatterPath)} to define it.`)
      console.log('Formatters should be a single exported function that takes an array of punch objects and returns a string.\n')
      console.log(`Here's a good starting point:`)
      console.log(`
module.exports = function (punches) {
  let str = ''

  // Do your thing!

  return str
}
`)
      return
    }

    const punches = await Punch.select(p => {
      if (start && p.in < start) {
        return false
      }
      if (end && p.in > end) {
        return false
      }
      if (project && p.project !== project) {
        return false
      }
      if (tag && !p.hasCommentObject(tag)) {
        return false
      }
      return true
    })

    const formatted = formatter(config, punches)

    if (destination) {
      fs.writeFileSync(resolvePath(destination), formatted)
      console.log('Exported punches were saved to ' + destination)
    } else {
      console.log(formatted)
    }
  }
})

run(ARGS)

bench.mark('parsed and run')
bench.printAll()
