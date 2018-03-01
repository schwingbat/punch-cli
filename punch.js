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
      return
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

if (flags.VERBOSE) {
  console.log({ params: process.argv.slice(2), flags })
}

// Dependencies
const path = require('path')
const moment = require('moment')
const readline = require('readline-sync')
const chalk = require('chalk')
const logUpdate = require('log-update')

global.appRoot = path.resolve(__dirname)

const config = require('./files/config')()
const Syncer = require('./sync/syncer')
const Invoicer = require('./invoicing/invoicer')
const Logger = require('./analysis/log')
const Punchfile = require('./files/punchfile')(config)
const SQLish = require('./files/sqlish')

// Formatting
const format = require('./utils/format')
const summaryfmt = require('./formatting/projsummary')

// Utils
const CLI = require('./utils/cli.js')
const package = require('./package.json')
const resolvePath = require('./utils/resolve-path')

const print = require('./analysis/printing')

const { autoSync } = config.sync

const { command, run, invoke } = CLI({
  name: 'punch',
  version: package.version,
})

/*=========================*\
||          Utils          ||
\*=========================*/

const getLabelFor = name => {
  return config.projects[name]
    ? config.projects[name].name
    : name
}

const getRateFor = name => {
  return config.projects[name]
    ? config.projects[name].hourlyRate
    : 0
}

const getFileFor = date => {
  date = new Date(date)
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()

  return path.join(config.punchPath, `punch_${y}_${m}_${d}.json`)
}

const getPunchedIn = (sqlish = SQLish(config, flags)) => {
  // Get punches that are currently punched in (have a punch out timestamp of null)
  return sqlish.select()
               .from('punches')
               .where(p => !p.out)
               .orderBy('in', 'desc')
               .run();
}

const getMessageFor = (file) => {
  // Returns a random message from the given file.
  // Assumes the file is a JSON file containing an array of strings in the resources/messages/ folder.
  try {
    const options = require('./resources/messages/' + file + '.json');
    const i = Math.round(Math.random() * options.length - 1);
    console.log(options, i);
    return options[i];
  } catch (err) {
    return "BLORK";
  }
}

const confirm = question => {
  let response;

  while (!['y', 'n', 'yes', 'no'].includes(response)) {
    response = readline.question(`${question} [y/n] `).toLowerCase().trim();

    if (response === 'y' || response === 'yes') {
      return true;
    } else if (response === 'n' || response === 'no') {
      return false;
    } else {
      console.log('Please enter: y, n, yes or no.');
    }
  }
}

const handleSync = () => {
  if (autoSync && !flags.NO_SYNC) {
    const syncer = Syncer(config, flags);
    syncer.sync();
  }
}

/*=========================*\
||      Parse/Dispatch     ||
\*=========================*/

command('in <project>',
        'start tracking time on a project', (args) => {

  const { project } = args;

  const current = getPunchedIn();

  if (current.length > 0) {
    console.log(`You're already punched in on ${getLabelFor(current[0].project)}! Punch out first.`);
  } else {
    const file = Punchfile.readOrCreate(getFileFor(Date.now()));
    file.punchIn(project);
    file.save();

    const time = moment().format('h:mm');
    console.log(`Punched in on ${getLabelFor(project)} at ${time}.`);

    handleSync();
  }
});

command('out [*comment]',
        'stop tracking time and record an optional description of tasks completed', (args) => {

  const { comment } = args;
  const current = getPunchedIn()[0];

  if (current) {
    current._file.punchOut(current.project);

    const label = getLabelFor(current.project);
    const time = format.time(Date.now());
    const duration = current.out - current.in;
    const pay = duration / 1000 / 60 / 60 * getRateFor(current.project);

    current.comments.push(comment);
    current._file.save();

    let str = `Punched out on ${label} at ${time}. Worked for ${format.duration(duration)}`;
    if (pay > 0) {
       str += ` and earned ${format.currency(pay)}`;
    }

    console.log(str + '.');

    handleSync();
  } else {
    console.log(`You're not punched in!`);
  }

});

command('comment [*comment]',
        'add a comment to your current session', (args) => {

  const sqlish = SQLish(config, flags);

  const { comment } = args;
  const active = sqlish.select()
    .from('punchfiles')
    .where(f => f.punches && f.punches.find(p => !p.out))
    .orderBy('created', 'desc')
    .limit(1)
    .run();

  if (active.length == 0) {
    const mostRecent = sqlish.select()
      .from('punches')
      .orderBy('out', 'desc')
      .limit(1)
      .run()
      [0];

    let label = getLabelFor(mostRecent.project);
    let inTime = moment(mostRecent.in);
    let outTime = moment(mostRecent.out);
    let date = new Date().getDate();

    if (inTime.date() !== date || outTime.date() !== date) {
      inTime = inTime.format('MMM Qo hh:mma');
      outTime = outTime.format('MMM Qo hh:mma');
    } else {
      inTime = inTime.format('hh:mma');
      outTime = outTime.format('hh:mma');
    }

    let str = `You're not punched in. Add to last punch on '${label}' (${inTime} - ${outTime})?`;

    if (confirm(str)) {
      mostRecent.comments.push(comment);
      mostRecent._file.save();

      handleSync();
    }
  } else {
    const file = active[0];
    const punch = file.punches.find(p => !p.out);

    punch.comments.push(comment);
    file.save();

    console.log('Comment saved.');
    handleSync();
  }
});

command('create <project> <timeIn> <timeOut> [*comment]',
        'create a punch', (args) => {

  const { project, timeIn, timeOut, comment } = args;

  let punchIn, punchOut;
  try {
    punchIn = moment(timeIn, 'MM-DD-YYYY@hh:mmA');
    punchOut = moment(timeOut, 'MM-DD-YYYY@hh:mmA');
  } catch (err) {
    console.log(`Please enter dates formatted as 'mm-dd-yyyy@hours:minutesAM' (err: ${err})`);
  }

  if (!punchIn.isValid() || !punchOut.isValid()) {
    return console.log('Please enter dates formatted as \'mm-dd-yyyy@hours:minutesAM\'');
  }

  const proj = config.projects[project];
  const duration = punchOut - punchIn;
  let pay;
  if (proj && proj.hourlyRate) {
    pay = format.currency(duration / 3600000 * proj.hourlyRate);
  } else {
    pay = 'N/A';
  }

  let str = '';

  str += `   Project: ${getLabelFor(project)}\n`;
  str += `   Time In: ${punchIn.format('dddd, MMM Do YYYY [@] h:mma')}\n`;
  str += `  Time Out: ${punchOut.format('dddd, MMM Do YYYY [@] h:mma')}\n`;
  str += `  Duration: ${format.duration(duration)}\n`;
  str += `       Pay: ${pay}\n`;

  if (comment) {
    str += `   Comment: ${comment}\n\n`;
  }

  str += '\nCreate this punch?';

  if (confirm(str)) {
    const file = Punchfile.forDate(punchIn.toDate());
    file.addPunch({
      project,
      in: punchIn.toDate(),
      out: punchOut.toDate(),
      comments: comment,
    });
    file.save();

    console.log('Punch created!');

    handleSync();
  }

});

command('purge <project>',
        'destroy all punches for a given project', (args) => {

  const { project } = args;
  const label = getLabelFor(project);
  const punches = SQLish(config, flags)
    .select()
    .from('punches')
    .where(p => p.project === project)
    .run();

  if (punches.length > 0) {
    const totalTime = punches.reduce((sum, p) =>
      sum + ((p.out || Date.now()) - p.in), 0);

    // Confirm and commit changes to files.
    const confirmString = `Purging ${label} would delete ${punches.length} punch${punches.length == 1 ? '' : 'es'} totalling ${format.duration(totalTime)}.`;

    console.log(confirmString);

    let response;

    while (response !== label) {
      response = readline.question(`Type in '${label}' if you're REALLY sure, or 'n' to cancel: `).toLowerCase().trim();

      if (response === label) {
        // Delete
        punches.forEach(punch => {
          punch._file.punches = punch._file.punches.filter(p => p !== punch);
          punch._file.save();
        });
        console.log(`Purged ${punches.length} punches.`);
      } else if (response === 'n') {
        return false;
      }
    }
  } else {
    console.log(`${label} has no punches.`);
  }

});

command('now',
        'show the status of the current session', () => {

  const active = getPunchedIn()[0];

  if (active) {
    const duration = Date.now() - active.in;
    const rate = getRateFor(active.project);
    const pay = duration / 1000 / 60 / 60 * getRateFor(active.project);
    const punchedIn = format.time(active.timestamp);

    let str = `You've been working on ${getLabelFor(active.project)} since ${punchedIn} (${format.duration(duration)} ago).`;

    if (rate) {
      str += ` Earned ${format.currency(pay)}.`;
    }

    console.log(str);
  } else {
    console.log('No current session.');
  }

});

command ('watch',
         'continue running to show automatically updated stats of your current session', () => {

  const active = getPunchedIn()[0];
  const clock = require('./utils/big-clock')({
    style: 'clockBlockDots',
    letterSpacing: 1,
  })

  if (active) {
    const project = config.projects[active.project];
    const label = project && project.name ? project.name : active.project;
    const rate = project && project.hourlyRate ? project.hourlyRate : 0;

    const update = () => {
      let time = Date.now() - active.in;
      let pay = (time / 3600000) * rate;
      let duration = format.duration(time);

      let working = `Working on ${label}`
      let money = format.currency(pay)
      let numbers = clock.display(format.clock(time))
      let numbersLength = numbers.split('\n')[0].length

      let topLine = working.padEnd(numbersLength - money.length, ' ') + money

      logUpdate('\n' + topLine + '\n' + numbers);
    }

    update();
    setInterval(update, 1000);
  } else {
    console.log('You aren\'t punched in right now.');
  }
});

command('project <name>',
        'get statistics for a specific project', (args) => {

  invoke(`projects ${args.name || ''}`);

});

command('projects [names...]',
        'show statistics for all projects in your config file', (args) => {

  let { names } = args;

  if (!names) {
    names = Object.keys(config.projects)
  }

  // TODO: Factor out Puncher
  // const puncher = Puncher(config, flags);
  // const projects = puncher.getProjectSummaries(args.names);

  const allPunches = SQLish(config, flags)
    .select()
    .from('punches')
    .orderBy('in', 'asc')
    .run();

  const summaries = [];

  for (let i = 0; i < names.length; i++) {
    const project = names[i];

    const punches = allPunches
        .filter(p => p.project === project);

    let firstPunch = punches[0];
    let latestPunch = punches[punches.length - 1];

    const projectData = config.projects[project];
    const fullName = projectData
      ? projectData.name
      : project;
    const totalTime = punches.reduce(
      (sum, punch) =>
        sum + ((punch.out || Date.now()) - punch.in - (punch.rewind || 0)),
      0);
    const totalHours = (totalTime / 3600000);
    const totalPay = projectData && projectData.hourlyRate
      ? totalHours * projectData.hourlyRate
      : 0;
    const hourlyRate = projectData && projectData.hourlyRate
      ? projectData.hourlyRate
      : 0;

    summaries.push({
      fullName,
      totalTime,
      totalHours,
      totalPay,
      hourlyRate,
      firstPunch,
      latestPunch,
      totalPunches: punches.length,
    });
  }

  summaries
    .sort((a, b) => a.fullName > b.fullName) // Sort alphabetically
    .forEach(s => console.log(print.projectSummary(summaryfmt(s))));
});

command('log [*when]',
        'show a summary of punches for a given period', (args) => {

  const log = Logger(config, flags);
  let when = args.when || 'today';
  let date = new Date();

  switch (when) {
  case 'today':
    log.forDay(date);
    break;
  case 'yesterday':
    date.setDate(date.getDate() - 1);
    log.forDay(date);
    break;
  case 'last week':
  case 'week':
  case 'this week':
    log.forWeek(date);
    break;
  case 'month':
  case 'this month':
    log.forMonth(date);
    break;
  case 'last month':
    date.setMonth(date.getMonth() - 1);
    log.forMonth(date);
    break;
  default:
    console.log(`Unknown time: ${when}`);
    break;
  }

});

command('today',
        'show a summary of today\'s punches (alias of "punch log today")', () => {

  invoke('log today');

});

command('yesterday',
        'show a summary of yesterday\'s punches (alias of "punch log yesterday")', () => {

  invoke('log yesterday');

});

command('week',
        'show a summary of punches for the current week (alias of "punch log this week")', () => {

  invoke('log this week');

});

command('month',
        'show a summary of punches for the current month (alias of "punch log this month")', () => {

  invoke('log this month');

});

command('invoice <project> <startDate> <endDate> <outputFile>',
        'automatically generate an invoice using punch data', (args) => {

  const active = getPunchedIn()[0]

  if (active && active.project === args.project) {
    return console.log(`You're currently punched in on ${getLabelFor(active.project)}. Punch out before creating an invoice.`);
  }

  let { project, startDate, endDate, outputFile } = args;
  const projectData = config.projects[project];
  if (!projectData) {
    console.log(`Can't invoice for ${chalk.red(project)} because your config file contains no information for that project.`);
    console.log(`You can run ${chalk.cyan('punch config')} to open your config file to add the project info.`);
    return;
  }

  if (!projectData.hourlyRate) {
    let message = "Can't invoice for nothing!";

    console.log(`${getLabelFor(project)} has no hourlyRate set. ${getMessageFor('no_hourly_rate')}`);
    return;
  }

  startDate = moment(startDate, 'MM-DD-YYYY').startOf('day');
  endDate = moment(endDate, 'MM-DD-YYYY').endOf('day');

  let format;
  let ext = path.extname(outputFile);

  switch (ext.toLowerCase()) {
    case '.pdf':
      format = 'PDF';
      break;
    case '.html':
      format = 'HTML';
      break;
    case '.txt':
      return console.log('Plaintext invoices are not yet supported. Use PDF.');
    default:
      return console.log(`Can't export to file with an extension of ${ext}`);
  }

  let str = '\n';

  str += print.labelTable([
    { label: 'Project', value: projectData.name || project },
    { label: 'Start Date', value: startDate.format('dddd, MMM Do YYYY') },
    { label: 'End Date', value: endDate.format('dddd, MMM Do YYYY') },
    { label: 'Invoice Format', value: format },
    { label: 'Output To', value: resolvePath(outputFile) },
  ]);
  console.log(str);

  let response;

  if (confirm('Create invoice?')) {
    const sqlish = SQLish(config, flags);
    const invoicer = Invoicer(config, flags);

    const punches = sqlish.select()
      .from('punches')
      .where(p => p.project === project
               && p.in >= startDate.valueOf()
               && p.in <= endDate.valueOf())
      .run();

    const data = {
      startDate,
      endDate,
      punches,
      project: projectData,
      user: config.user,
      output: {
        path: resolvePath(outputFile),
      }
    };

    console.log(data)

    invoicer.create(data, format);
  }
});

command('sync',
        'synchronize with any providers in your config file', () => {

  const syncer = Syncer(config, flags);
  syncer.sync();
});

command('config [editor]',
        'open config file in editor - uses EDITOR env var unless an editor command is specified.', args => {

  const editor = args.editor || process.env.EDITOR;

  if (editor == null) {
    return console.error('No editor specified and no EDITOR variable available. Please specify an editor to use: punch config <editor>');
  }

  const spawn = require('child_process').spawn;
  const configPath = config.configPath;

  const child = spawn(editor, [configPath], { stdio: 'inherit' });
});

run(process.argv.slice(2).filter(a => a[0] !== '-'));
