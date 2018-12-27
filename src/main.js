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
const is = require('@schwingbat/is')
const pkg = require('../package.json')

const { command, run, invoke } = CLI({
  name: 'punch',
  version: pkg.version
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
        console.log('punch v' + pkg.version)
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
config.flags = flags

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

const confirmAdjustedTime = (date, template = 'Set time to $?') => {
  const format = require('date-fns/format')
  const isSameDay = require('date-fns/is_same_day')

  let stringFmt = config.display.timeFormat

  if (!isSameDay(new Date(), date)) {
    stringFmt += ` [on] ${config.display.dateFormat}`
  }

  return confirm(template.replace('$', format(date, stringFmt)))
}

const handleSync = async ({ silent } = {}) => {
  if (autoSync && !flags.NO_SYNC) {
    const Syncer = require('./sync/syncer')
    return new Syncer(config, Punch).syncAll({ silent, auto: true })
  } else {
    return Promise.resolve()
  }
}

const loadImporter = (name) => {
  let formatter
  let formatterPath = path.join(config.punchPath, 'importers', name + '.js')
  try {
    formatter = require(formatterPath)
  } catch (err) {
    console.log(chalk.red(`\nNo formatter for '${name}'`))
    console.log(`You can create ${chalk.green(formatterPath)} to define it.`)
    console.log('Formatters should be a single exported function that takes a file\'s contents as a string and returns an array of Punch objects.\n')
      console.log(`Here's a good starting point:`)
      console.log(`
module.exports = function (fileContentsStr, Punch) {
  const punches = []

  // Do your thing!
  // punches.push(new Punch(...))

  return punches
}
`)
    return
  }

  return formatter
}

const updateCurrentMarker = (current) => {
  // Updates the ~/.punch/current file
  let label = ''
  if (is.string(current)) {
    label = current
  } else if (current instanceof Punch) {
    label = getLabelFor(current.project)
  }

  fs.writeFileSync(path.join(path.dirname(config.configPath), 'current'), label)
}

const allPunchedIn = async () => {
  const names = Object.keys(config.projects)
  const punchedIn = []

  for (let i = 0; i < names.length; i++) {
    if (await Punch.current(names[i])) {
      punchedIn.push(names[i])
    }
  }

  return punchedIn
}

/* ========================= *\
||       Parse/Dispatch      ||
\* ========================= */

command('in <project>', {
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
  }, {
    name: 'dry-run',
    description: 'run but don\'t commit punch',
    type: 'boolean'
  }],
  run: async function (args) {
    const loader = Loader()
    const dryRun = !!args.options['dry-run']

    loader.start('Punching in...')

    await handleSync({ silent: true })

    const current = await Punch.current(args.project)

    if (current) {
      loader.stop(chalk.red(config.symbols.error) + ` You're already punched in on ${getLabelFor(current.project)}! Punch out first.`)
    } else {
      // Check if project is in config file
      if (config.projects[args.project]) {

        if (args.options.time && !confirmAdjustedTime(args.options.time, 'Punch in at $?')) {
          loader.stop()
          return
        }

        const punch = new Punch({
          project: args.project,
          in: args.options.time
        })

        if (!dryRun) {
          await punch.save()
        }

        updateCurrentMarker(punch)

        // const time = format(new Date(), config.display.timeFormat)
        loader.stop(chalk.green(config.symbols.success) + ` Punched in on ${getLabelFor(args.project)}. ${getMessageFor('punched-in', { default: '' })}`)

        if (!dryRun) {
          handleSync()
        }
      } else {
        loader.stop(`\n${chalk.yellow(config.symbols.warning)} ${chalk.bold(args.project)} is not a project in your config file. You'll have to add it first.\nEnter '${chalk.bold('punch config')}' to edit your configuration.\n`)
      }
    }
  }
})

command('out [project]', {
  description: 'stop tracking time',
  arguments: [{
    name: 'project',
    description: 'name of the project'
  }],
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
  }, {
    name: 'dry-run',
    description: 'run but don\'t commit punch out',
    type: 'boolean'
  }],
  run: async function (args) {
    const loader = Loader()
    const dryRun = args.options['dry-run']

    loader.start('Punching out...')

    await handleSync({ silent: true })

    let current

    if (args.project) {
      current = await Punch.current(args.project)
    } else {
      const punchedIn = await allPunchedIn()

      if (punchedIn.length >= 2) {
        let str = `\nYou are punched in on ${punchedIn.length} projects:\n  `
        str += punchedIn.join('\n  ')
        str += '\n\n'
        str += 'Specify which one you want to punch out of:\n  '
        str += punchedIn.map(s => `punch out ${s}`).join('\n  ')
        str += '\n'
        loader.stop(str)
        return
      } else if (punchedIn.length == 1) {
        current = await Punch.current(punchedIn[0])
      }
    }

    if (current) {
      if (current.comments.length === 0 && !args.options.comment) {
        let noComment

        if (args.options['no-comment']) {
          noComment = true
        } else {
          noComment = confirm('Are you sure you want to punch out with no comment?')
        }

        if (!noComment) {
          loader.stop(`Use the --comment or -c flags to add a comment:\n  usage: punch out -c "This is a comment."\n`)
          return
        }
      }

      if (args.options.time && !confirmAdjustedTime(args.options.time, 'Punch out at $?')) {
        loader.stop()
        return
      }

      const formatDate = require('date-fns/format')
      const formatDuration = require('./format/duration')
      const formatCurrency = require('./format/currency')

      if (!dryRun) {
        await current.punchOut(args.options.comment, {
          autosave: true,
          time: args.options.time || new Date()
        })
      }

      const label = getLabelFor(current.project)
      const duration = formatDuration(current.duration(args.options.time))
      const time = formatDate(args.options.time || new Date(), config.display.timeFormat)
      const pay = current.pay(args.options.time)

      let str = `Punched out on ${label} at ${time}. Worked for ${duration}`
      if (pay > 0) {
        str += ` and earned ${formatCurrency(pay)}`
      }
      loader.stop(chalk.green(config.symbols.success) + ' ' + str + '.')

      updateCurrentMarker('')
      if (!dryRun) { handleSync() }
    } else {
      loader.stop(chalk.yellow(config.symbols.warning) + ` You're not punched in!`)
    }
  }
})

command('log [when...]', {
  description: 'show a summary of punches for a given period ("last month", "this week", "two days ago", etc)',
  examples: [
    'punch log today',
    'punch log last tuesday',
    'punch log this month',
    'punch log -s 2018-11-25 -e 2018-12-25 -p punch'
  ],
  arguments: [{
    name: 'when',
    description: 'time period to log',
    default: 'today',
    parse: words => words.join(' ')
  }],
  options: [{
    name: 'start',
    short: 's',
    type: 'string',
    description: 'log punches between specific dates (use with --end)'
  }, {
    name: 'end',
    short: 'e',
    type: 'string',
    description: 'log punches between specific dates (use with --start)'
  }, {
    name: 'project',
    short: 'p',
    type: 'string',
    description: 'show only punches for a given project'
  }, {
    name: 'object',
    short: 'o',
    type: 'string',
    description: 'show only punches tagged with a given comment object (e.g. @task:1669)'
  }, {
    name: 'with-ids',
    type: 'boolean',
    description: 'print punch IDs'
  }, {
    name: 'with-graphics',
    type: 'boolean',
    description: 'override app config and show hourly punch graphics'
  }],
  run: function (args) {
    const fuzzyParse = require('./utils/fuzzy-parse')
    const parseDateTime = require('./utils/parse-datetime')
    let interval

    let start = args.options['start']
    let end = args.options['end']

    if (start && !end || !start && end) {
      console.log('--start and --end options must be used together')
      return
    }

    if (start && end) {
      interval = {
        unit: 'period',
        modifier: 0,
        start: fuzzyParse(start).start,
        end: fuzzyParse(end).end
      }
    } else {
      interval = fuzzyParse(args.when)
    }

    if (args.options['with-ids']) {
      config.display.showPunchIDs = true
      config.display.showCommentIndices = true
    }

    if (args.options['with-graphics']) {
      config.display.showDayGraphics = true
    }

    if (interval) {
      require('./logging/log')(config, Punch).forInterval(interval, args.options)
    }
  }
})

command('today', {
  description: 'show a summary of today\'s punches (alias of "punch log today")',
  hidden: true,
  run: function () {
    invoke('log today')
  }
})

command('yesterday', {
  description: 'show a summary of yesterday\'s punches (alias of "punch log yesterday")',
  hidden: true,
  run: function () {
    invoke('log yesterday')
  }
})

command('week', {
  description: 'show a summary of punches for the current week (alias of "punch log this week")',
  hidden: true,
  run: function () {
    invoke('log this week')
  }
})

command('month', {
  description: 'show a summary of punches for the current month (alias of "punch log this month")',
  hidden: true,
  run: function () {
    invoke('log this month')
  }
})

command('comment <comment...>', {
  description: 'add a comment to remember what you worked on',
  arguments: [{
    name: 'comment',
    description: 'a description of what you worked on',
    parse: (words) => words.join(' ')
  }],
  options: [{
    name: 'project',
    alias: 'p',
    description: 'the active project to add the comment to',
    type: 'string'
  }],
  run: async function (args) {

    const punchedIn = await allPunchedIn()

    if (punchedIn.length > 1 && !args.options.project) {
      console.log('\nYou are punched in on more than one project. Use the -p flag to specify which project to comment on.')
      let str = ''
      for (let i = 0; i < punchedIn.length; i++) {
        if (i == 0) {
          str += '  e.g. '
        } else {
          str += '       '
        }
        str += `punch comment -p ${punchedIn[i]} "${args.comment}"\n`
      }
      console.log(str)
      return
    }

    const current = await Punch.current(args.options.project)
    const { dayPunches } = require('./logging/printing')

    if (current) {
      current.addComment(args.comment)
      await current.save()

      console.log('\n  ' + dayPunches([current], Date.now(), config).replace(/\n/g, '\n  '))
      console.log('Comment saved.')
      handleSync()
    } else {
      const formatDate = require('date-fns/format')
      const latest = await Punch.latest()

      // let label = getLabelFor(latest.project)
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

      let str = `\nYou're not punched in. Add to last punch?\n\n`
      str += '  ' + dayPunches([latest], date, config).replace(/\n/g, '\n  ')
      str += '  ' + chalk.green(` + ${args.comment}`)
      str += '\n\n'

      if (confirm(str)) {
        latest.addComment(args.comment)
        await latest.save()

        console.log('\nComment saved.')

        handleSync()
      }
    }
  }
})

command('add-comment <punchID> <comment...>', {
  description: 'add a comment to a specific punch',
  arguments: [{
    name: 'punchID',
    description: 'ID of a given punch (use "punch log --with-ids" to find IDs)'
  }, {
    name: 'comment',
    description: 'comment text',
    parse: (val) => val.join(' ')
  }],
  run: async function (args) {
    const punch = (await Punch.select(p => p.id === args.punchID))[0]

    if (punch) {
      const { dayPunches } = require('./logging/printing')

      let str = '\n'

      str += '  ' + dayPunches([punch], punch.in, config).replace(/\n/g, '\n  ')
      str += '  ' + chalk.green(` + ${args.comment}`)
      str += '\n\n'

      str += 'Add comment?'

      if (confirm(str)) {
        punch.addComment(args.comment)
        punch.update()
        await punch.save()

        console.log('\nComment added.')

        handleSync()
      }

    } else {
      console.log('Punch not found')
    }
  }
})

command('replace-comment <punchID> <commentIndex> <newComment>', {
  description: 'replace the text of an existing comment',
  arguments: [{
    name: 'punchID',
    description: 'ID of a given punch (use "punch log --with-ids" to find IDs)'
  }, {
    name: 'commentIndex',
    description: 'index of the comment to edit',
    parse: (val) => parseInt(val)
  }, {
    name: 'newComment',
    description: 'new comment content',
    // parse: (val) => parseInt(val)
  }],
  run: async function (args) {
    const punch = (await Punch.select(p => p.id === args.punchID))[0]

    if (punch) {
      if (punch.comments[args.commentIndex]) {
        const { dayPunches } = require('./logging/printing')

        const lines = dayPunches([punch], punch.in, config).split('\n').filter(l => l != '')

        let str = '\n  ' + lines.shift() + '\n  '

        for (let i = 0; i < lines.length; i++) {
          if (i === args.commentIndex) {
            str += '     ' + chalk.red('- ' + punch.comments[i].toStringPlain()) + '\n  '
            str += '     ' + chalk.green('+ ' + args.newComment) + '\n  '
          } else {
            str += '  ' + lines[i] + '\n  '
          }
        }

        str += '\nReplace comment?'

        if (confirm(str)) {
          // Set old comment to deleted
          punch.comments[args.commentIndex].raw = args.newComment
          punch.update()
          await punch.save()

          console.log('\nComment replaced.')

          handleSync()
        }
      } else {

      }
    } else {
      console.log('Punch not found.')
    }
  }
})

command('delete-comment <punchID> <commentIndex>', {
  description: 'delete a comment from a punch',
  arguments: [{
    name: 'punchID',
    description: 'ID of a given punch (use "punch log --with-ids" to find IDs)'
  }, {
    name: 'commentIndex',
    description: 'index of the comment to replace',
    parse: (val) => parseInt(val)
  }],
  run: async function (args) {
    const punch = (await Punch.select(p => p.id === args.punchID))[0]

    if (punch) {
      if (punch.comments[args.commentIndex]) {
        const { dayPunches } = require('./logging/printing')

        const lines = dayPunches([punch], punch.in, config).split('\n').filter(l => l != '')

        let str = '\n  ' + lines.shift() + '\n  '

        for (let i = 0; i < lines.length; i++) {
          if (i === args.commentIndex) {
            str += '     ' + chalk.red('- ' + punch.comments[i].toStringPlain()) + '\n  '
          } else {
            str += '  ' + lines[i] + '\n  '
          }
        }

        str += '\nDelete comment?'

        if (confirm(str)) {
          // Set deleted to true and the storage service will handle the rest
          punch.comments[args.commentIndex].deleted = true
          punch.update()
          await punch.save()

          console.log('\nComment deleted.')

          handleSync()
        }
      } else {
        console.log('No comment found at index ' + args.index)
      }
    } else {
      console.log('Punch not found.')
    }
  }
})

command('create <project>', {
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
        in: timeIn,
        out: timeOut,
        rate: project.hourlyRate || 0
      })
      if (comment) {
        punch.addComment(comment)
      }
      punch.save()

      console.log('Punch created!')

      handleSync()
    }
  }
})

command('delete <punchID>', {
  description: 'delete a punch',
  arguments: [{
    name: 'punchID',
    description: 'ID of a given punch (use "punch log --with-ids" to find IDs)',
  }],
  options: [{
    name: 'yes',
    short: 'y',
    description: 'delete without confirmation',
    type: 'boolean'
  }],
  run: async function (args) {
    const punch = (await Punch.select(p => p.id === args.punchID))[0]

    if (punch) {
      const { dayPunches } = require('./logging/printing')

      console.log('\n  ' + dayPunches([punch], punch.in, config).replace(/\n/g, '\n  '))

      if (args.yes || confirm('Delete this punch?')) {
        punch.delete()
        console.log('BOOM! It\'s gone.')
      }
    } else {
      console.log('Punch not found')
    }
  }
})

command('adjust <punchID>', {
  description: 'adjust punch start/end times',
  arguments: [{
    name: 'punchID',
    description: 'ID of a given punch (use "punch log --with-ids" to find IDs)',
    // parse: val => val
  }],
  options: [{
    name: 'start',
    short: 's',
    description: 'start date and time for punch',
    type: parseDateTime
  }, {
    name: 'end',
    short: 'e',
    description: 'start date and time for punch',
    type: parseDateTime
  }],
  run: async function (args) {
    const punch = (await Punch.select(p => p.id === args.punchID))[0]

    if (punch) {
      const format = require('date-fns/format')
      if (!punch.out && args.options.end) {
        return console.log('You can\'t set and end for a running punch. Use ' + chalk.bold('punch out -t <value>') + ' to set a punch out time.')
      }

      if (args.options.start) punch.in = args.options.start
      if (args.options.end) punch.out = args.options.end

      // TODO: Show comparison/preview of changes with a real confirmation

      console.log({
        start: format(punch.in, config.display.dateFormat + ' ' + config.display.timeFormat),
        end: format(punch.out, config.display.dateFormat + ' ' + config.display.timeFormat)
      })

      if (confirm('?')) {
        await punch.save()
        console.log('Saved')
      }
    } else {
      console.log('Punch not found')
    }
  }
})

command('invoice <project> <startDate> <endDate> <outputFile>', {
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
  options: [
    {
      name: 'format',
      description: 'specify a format rather than guessing from file name',
      type: 'string'
    },
    {
      name: 'yes',
      short: 'y',
      description: 'generation without confirming details',
      type: 'boolean'
    }
  ],
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

    if (args.options.format) {
      fileFormat = args.options.format
    } else {
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
            format: fileFormat,
            customFormat: !!args.options.format
          }
        }, false /*!!args.options.local*/)
        loader.stop(`${fileFormat} invoice generated!`)
      } catch (err) {
        loader.stop(`There was an error while generating the invoice: ${err.message}`)
      }
    }
  }
})

command('sync [services...]', {
  description: 'synchronize with any services in your config file',
  arguments: [{
    name: 'services',
    description: 'list of services to sync with (matches label or service name)'
  }],
  options: [{
    name: 'check',
    short: 'c',
    description: 'check for differences but don\'t upload or download',
    type: 'boolean'
  }],
  run: async function (args) {
    const Syncer = require('./sync/syncer')
    await new Syncer(config, Punch).syncAll({
      services: args.services,
      check: args.options.check || false
    })

    updateCurrentMarker(await Punch.current())
  }
})

command('config', {
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

command('purge <project>', {
  description: 'destroy all punches for a given project',
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
        for (const punch in punches) {
          await Punch.storage.delete(punch)
        }
        console.log(`Deleted ${punches.length} punches.`)
      }
    } else {
      console.log(`${label} has no punches.`)
    }
  }
})

command('watch', {
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

command('projects [names...]', {
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

command('timestamp [time]', {
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
    const timestamp = args.time.getTime()

    console.log(timestamp + chalk.grey(' << ') + formatDate(args.time, 'MMM Do YYYY, hh:mm:ssa'))
  }
})

command('rename-project <from> <to>', {
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

command('rename-comment-object <from> <to>', {
  description: 'rename comment objects with name <from> to name <to>',
  hidden: true,
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

command('adjust-rate <project> <newRate>', {
  description: 'adjust pay rate for punches',
  //hidden: true,
  examples: [
    'punch adjust-rate punch 50 --start 2018-08-01 --end 2018-09-01'
  ],
  arguments: [{
    name: 'project',
    description: 'project alias',
  }, {
    name: 'newRate',
    description: 'new rate (number)',
    parse: Number
  }],
  options: [{
    name: 'start',
    description: 'starting date',
    type: parseDateTime
  }, {
    name: 'end',
    description: 'ending date',
    type: parseDateTime
  }],
  run: async function (args) {
    const { project, newRate } = args
    const { start, end } = args.options

    const punches = await Punch.select(p => p.project === project
                                         && (!start || p.in >= start)
                                         && (!end || p.in <= end))

    if (confirm(`Change rate to ${newRate} on ${punches.length} punches?`)) {
      for (let punch of punches) {
        punch.rate = newRate
        punch.update()
        punch.save()
      }

      console.log('Updated punches')
    }
  }
})

command('import <file>', {
  description: 'imports punch data from a file',
  examples: [
    'punch import ~/export.csv -f hourstracker'
  ],
  arguments: [{
    name: 'file',
    description: 'path to a file of importable data',
  }],
  options: [{
    name: 'format',
    short: 'f',
    description: 'name of function to handle import (defined in ~/.punch/formatters/import)',
    type: 'string'
  }],
  run: async function (args) {
    let contents
    try {
      contents = fs.readFileSync(args.file, 'utf8')
    } catch (err) {
      console.log('Error loading file: ' + err.message)
    }

    if (!args.options.format) {
      return console.log('Must pass --format with value')
    }

    const { simplePunches } = require('./logging/printing')
    const formatter = loadImporter(args.options.format)
    const dateFmt = require('date-fns/format')
    if (formatter) {
      const punches = formatter(contents, Punch)

      const byDate = {}

      for (const punch of punches) {
        const key = dateFmt(punch.in, config.display.dateFormat)
        if (!byDate[key]) byDate[key] = []
        byDate[key].push(punch)
      }

      console.log()
      for (const date in byDate) {
        console.log(chalk.white.bold.underline(date) + '\n')
        console.log(simplePunches(byDate[date], config))
      }

      // TODO: Add overlap detection

      if (confirm('Import these punches?')) {
        for (const punch of punches) {
          await punch.save()
        }
        console.log(`${punches.length} punches imported.`)
      }
    }
  }
})

command('export', {
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
    description: 'formatting function file name (looks in ~/.punch/formatters)',
    type: 'string'
  }, {
    name: 'output',
    short: 'o',
    description: 'file path to save to (prints to console by default)',
    type: 'string'
  }],
  run: async function(args) {
    const { start, end, project, tag, format, output } = args.options
    const resolvePath = require('./utils/resolve-path')
    const path = require('path')

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
      fs.writeFileSync(resolvePath(output), formatted)
      console.log('Exported punches were saved to ' + output)
    } else {
      console.log(formatted)
    }
  }
})

command('migrate-from-sqlite', {
  description: 'copies SQLite DB contents into NEDB file',
  hidden: true,
  async run (args) {
    if (Punch.storage.name === 'sqlite') {
      console.log('Migration from SQLite to SQLite doesn\'t make any sense.')
      return
    }

    const SQLiteStorage = require('./storage/services/sqlite.service.js')
    const SQLitePunch = require('./punch/punch')(config, SQLiteStorage)

    const punches = await SQLitePunch.all()

    for (const punch of punches) {
      await Punch.storage.save(punch)
    }

    console.log(`Migrated ${punches.length} punches`)
  }
})

run(ARGS)

bench.mark('parsed and run')
bench.printAll()

// Exit cleanup

async function exitHandler(options) {
  await Punch.storage.cleanUp()

  if (options.exit) process.exit()
}

process.on('exit', exitHandler.bind(null, { cleanup: true }))
process.on('uncaughtException', exitHandler.bind(null, { exit: true }))

// ctrl + c
process.on('SIGINT', exitHandler.bind(null, { exit: true }))

// kill pid (e.g. nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }))
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }))