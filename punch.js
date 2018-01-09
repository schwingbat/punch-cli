#!/usr/bin/env node

const startTime = Date.now();

const flags = require('./flags');

// Process command line args into params/flags

process.argv.slice(2).forEach(arg => {
  if (arg[0] === '-') {
    switch (arg.toLowerCase()) {
    case '-v':
    case '--verbose':
      flags.VERBOSE = true;
      break;
    case '-b':
    case '--benchmark':
      flags.BENCHMARK = true;
      break;
    }
  }
});

if (flags.VERBOSE) {
  console.log({ params: process.argv.slice(2), flags });
}

if (flags.BENCHMARK) {
  console.log(`Args parsed at ${Date.now() - startTime}ms`);
}

// Dependencies
const path = require('path');
const moment = require('moment');
const logUpdate = require('log-update');
const readline = require('readline-sync');
const chalk = require('chalk');

const config = require('./files/config')();
const tracker = require('./files/tracker')(config);
const Puncher = require('./files/puncher');
const Syncer = require('./sync/syncer');
const Invoicer = require('./invoicing/invoicer');
const Punchfile = require('./files/punchfile')(config);

// Formatting
const datefmt = require('./formatting/time');
const durationfmt = require('./formatting/duration');
const currencyfmt = require('./formatting/currency');
const summaryfmt = require('./formatting/projsummary');

// Utils
const resolvePath = require('./utils/resolvepath');
const CLI = require('./utils/cli.js');
const package = require('./package.json');

const print = require('./analysis/printing');

const { autoSync } = config.sync;

const { command, run, invoke } = CLI({
  name: 'punch',
  version: package.version,
});

if (flags.BENCHMARK) console.log(`Modules required at ${Date.now() - startTime}ms`);

/*=========================*\
||          Utils          ||
\*=========================*/

const getLabelFor = name => {
  const project = config.projects.find(p => p.alias === name);
  if (project) {
    return project.name;
  } else {
    return name;
  }
};

const getRateFor = name => {
  const project = config.projects.find(p => p.alias === name);
  if (project) {
    return project.hourlyRate;
  } else {
    return 0;
  }
}

const getFileFor = date => {
  date = new Date(date);
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();

  return path.join(config.punchPath, `punch_${y}_${m}_${d}.json`);
}

const warnIfUnsynced = () => {
  const syncable = config.sync.autoSync == false
                || Object.keys(config.sync.backends).length > 0;

  const changes = tracker.unsynced();

  if (syncable && changes) {
    console.log(`You have ${changes} unsynced change${changes == 1 ? '' : 's'}. Run 'punch sync' to synchronize.`);
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

/*=========================*\
||      Parse/Dispatch     ||
\*=========================*/

command('in <project>',
        'start tracking time on a project', (args) => {

  const { project } = args;

  if (tracker.hasActive()) {
    console.log(`You're already punched in on ${getLabelFor(project)}! Punch out first.`);
  } else {
    const file = Punchfile.readOrCreate(getFileFor(Date.now()));
    file.punchIn(project);
    file.save();
    tracker.setActive(project);

    const time = moment().format('h:mm');
    console.log(`Punched in on ${getLabelFor(project)} at ${time}.`);
    
    if (autoSync) {
      const syncer = Syncer(config, flags);
      syncer.sync();
      tracker.resetSync();
    } else {
      tracker.incrementSync();
      warnIfUnsynced();
    }
  }
});

command('out [*comment]',
        'stop tracking time and record an optional description of tasks completed', (args) => {

  const { comment } = args;
  const active = tracker.getActive();
  
  if (active) {
    const file = Punchfile.read(getFileFor(active.timestamp));

    const label = getLabelFor(active.project);
    const time = datefmt.time(Date.now());
    const duration = Date.now() - active.timestamp;
    const pay = duration / 1000 / 60 / 60 * getRateFor(active.project);

    file.punchOut(active.project);
    file.mostRecentPunch().comments.push(comment);
    file.save();
    tracker.clearActive();

    console.log(`Punched out on ${label} at ${time}. Worked for ${durationfmt(duration)} and earned ${currencyfmt(pay)}.`);
    
    if (autoSync) {
      const syncer = Syncer(config, flags);
      syncer.sync();
      tracker.resetSync();
    } else {
      tracker.incrementSync();
      warnIfUnsynced();
    }
  } else {
    console.log(`You're not punched in!`);
  }

});

command('comment [*comment]',
        'add a comment to your current session', (args) => {

  const { comment } = args;
  const active = tracker.getActive();

  const file = Punchfile.mostRecent();
  const punch = file.mostRecentPunch();

  if (!active) {
    let str = `You're not punched in. Do you want to apply the comment to your latest punch on ${getLabelFor(punch.project)}?`;

    str += '\n\n';

    str += getLabelFor(punch.project);

    str += '\n\n';

    if (!confirm(str)) {
      return;
    }
  }

  punch.comments.push(comment);
  file.save();

  console.log(punch);

  // if (!tracker.hasActive()) {
  //   if ()
  // }

  // if (tracker.hasActive()) {
  //   const active = tracker.getActive();
  //   const file = Punchfile.read(getFileFor(active.timestamp));

  //   const punch = file.mostRecentPunch(active.project);

  //   console.log(punch);
  // } else {
  //   // Want to apply to previous session?
  //   const 

  //   console.log(comment);
  // }

});


command('rewind <amount>',
        'subtract payable time from a project to account for breaks and interruptions', (args) => {

  const puncher = Puncher(config, flags);
  const current = puncher.currentSession();
  const { amount } = args;

  if (current) {
    puncher.rewind(amount);
    console.log(`Rewound by ${amount} on current ${getLabelFor(current.project)} session.`);
    if (autoSync) {
      const syncer = Syncer(config, flags);
      syncer.sync();
      tracker.resetSync();
    } else {
      tracker.incrementSync();
      warnIfUnsynced();
    }
  } else {
    console.log('You\'re not currently punched in. Do you want to apply this rewind to the previous session?');
    console.log('[NOT IMPLEMENTED] Get user input (y/n)');
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

  const proj = config.projects.find(p => p.alias === project);
  const duration = punchOut - punchIn;
  let pay;
  if (proj && proj.hourlyRate) {
    pay = currencyfmt(duration / 3600000 * proj.hourlyRate);
  } else {
    pay = 'N/A';
  }

  let str = '';

  str += `   Project: ${getLabelFor(project)}\n`;
  str += `   Time In: ${punchIn.format('dddd, MMM Do YYYY [@] h:mma')}\n`;
  str += `  Time Out: ${punchOut.format('dddd, MMM Do YYYY [@] h:mma')}\n`;
  str += `  Duration: ${durationfmt(duration)}\n`;
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

    if (autoSync) {
      const syncer = Syncer(config, flags);
      syncer.sync();
      tracker.resetSync();
    } else {
      tracker.incrementSync();
      warnIfUnsynced();
    }
  }

});

command('purge <project>',
        'destroy all punches for a given project', (args) => {

  const { project } = args;
  const label = getLabelFor(project);
  const files = Punchfile.all();

  const modified = [];
  let punchCount = 0;
  let totalTime = 0;

  // Find and modify Punchfile objects with matching punches.
  files.forEach(f => {
    let modded = false;

    // Filter out punches that match the given project alias.
    // MANY SIDE EFFECTS. SUCH FUNCTIONAL. WOW.
    f.punches = f.punches.filter(p => {
      if (p.project === project) {
        console.log(p);
        modded = true;
        punchCount += 1;
        totalTime += (p.out || Date.now()) - p.in - p.rewind;
        return false;
      } else {
        return true;
      }
    });

    if (modded) {
      modified.push(f);
    }
  });

  if (punchCount > 0) {
    // Confirm and commit changes to files.
    const confirmString = `Purging ${label} would delete ${punchCount} punch${punchCount == 1 ? '' : 'es'} totalling ${durationfmt(totalTime)}. Do you really want to continue?`;

    if (confirm(confirmString)) {

      console.log('Committing changes...');
      modified.forEach(f => {
        f.save();
      });

      tracker.incrementSync(modified.length);

      console.log(`Purged ${label}.`);

      if (autoSync) {
        const syncer = Syncer(config, flags);
        syncer.sync();
        tracker.resetSync();
      } else {
        warnIfUnsynced();
      }
    }
  } else {
    console.log(`Project ${label} has no punches.`);
  }

});

command('now',
        'show the status of the current session', () => {

  const active = tracker.getActive();

  if (active) {
    const duration = Date.now() - active.timestamp;
    const rate = getRateFor(active.project);
    const pay = duration / 1000 / 60 / 60 * getRateFor(active.project);
    const punchedIn = datefmt.time(active.timestamp);

    let str = `You punched in on ${getLabelFor(active.project)} at ${punchedIn} (${durationfmt(duration)} ago)`;

    if (rate) {
      str += ` and have earned ${currencyfmt(pay)}`;
    }

    console.log(str + '.');
  } else {
    console.log('No current session.');
  }

});

command ('watch',
         'continue running to show automatically updated stats of your current session', () => {

  const active = tracker.getActive();

  if (active) {
    const project = config.projects.find(p => p.alias === active.project);
    const label = project && project.name ? project.name : active.project;
    const rate = project && project.hourlyRate ? project.hourlyRate : 0;

    const update = () => {
      let time = Date.now() - active.timestamp;
      let pay = (time / 3600000) * rate;
      let duration = durationfmt(time);

      let str = `\nYou've been working on ${label} for ${duration}`;

      if (pay && pay > 0) {
        str += ` (${currencyfmt(pay)})\n`;
      }

      logUpdate(str + '.');
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

  const puncher = Puncher(config, flags);
  const projects = puncher.getProjectSummaries(args.names);

  projects.forEach(p => console.log(print.projectSummary(summaryfmt(p))));
});

command('log [*when]',
        'show a summary of punches for a given period', (args) => {

  const puncher = Puncher(config, flags);
  let when = args.when || 'today';
  let date = new Date();

  switch (when) {
  case 'today':
    puncher.reportForDay(date);
    break;
  case 'yesterday':
    date.setDate(date.getDate() - 1);
    puncher.reportForDay(date);
    break;
  case 'last week':
  case 'week':
  case 'this week':
    console.log('Weekly report not implemented yet');
    break;
  case 'month':
  case 'this month':
    puncher.reportForMonth(date);
    break;
  case 'last month':
    date.setMonth(date.getMonth() - 1);
    puncher.reportForMonth(date);
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

  let { project, startDate, endDate, outputFile } = args;
  const projectData = config.projects.find(p => p.alias === project);
  if (!projectData) {
    console.log(`Can't invoice for ${chalk.red(project)} because your config file contains no information for that project.`);
    console.log(`You can run ${chalk.cyan('punch config')} to open your config file to add the project info.`);
    return;
  }

  project = projectData.name;
  startDate = moment(startDate, 'MM-DD-YYYY');
  endDate = moment(endDate, 'MM-DD-YYYY');
  
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
    { label: 'Project', value: projectData.name || alias },
    { label: 'Start Date', value: startDate.format('dddd, MMM Do YYYY') },
    { label: 'End Date', value: endDate.format('dddd, MMM Do YYYY') },
    { label: 'Invoice Format', value: format },
    { label: 'Output To', value: resolvePath(outputFile) },
  ]);
  console.log(str);

  let response;
  
  if (confirm('Create invoice?')) {
    const puncher = Puncher(config, flags);
    const invoicer = Invoicer(config, flags);

    const data = {
      startDate,
      endDate,
      punches: puncher
        .getPunchesForPeriod(startDate.toDate(), endDate.toDate())
        .filter(p => p.project === projectData.alias),
      project: projectData,
      user: config.user,
      output: {
        path: resolvePath(outputFile),
      }
    };

    invoicer
      .create(data, format);
  }
});

command('sync [providers...]',
        'synchronize with any providers you have configured', () => {

  const syncer = Syncer(config, flags);
  syncer.sync();
  tracker.resetSync();
});

command('config [editor]',
        'open config file in editor - uses EDITOR env var unless an editor command is specified.', args => {

  const editor = args.editor || process.env.EDITOR;

  if (!editor) {
    console.error('No editor specified and no EDITOR variable available. Please specify an editor to use: punch config <editor>');
  }

  console.log(`Editing with ${editor}`);
  const exec = require('child_process').execSync;

  exec(`${editor} ~/.punch/punchconfig.json`);

});

if (flags.BENCHMARK) {
  console.log(`Commands parsed at ${Date.now() - startTime}ms`);
}

run(process.argv.slice(2));

if (flags.BENCHMARK) {
  console.log(`Program run in ${Date.now() - startTime}ms`);
}