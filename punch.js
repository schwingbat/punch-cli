#!/usr/bin/env node

const readline = require('readline-sync');
const moment = require('moment');
const path = require('path');
const flags = require('./flags');
const CLI = require('./utils/cli.js');
const package = require('./package.json');

const { command, run, invoke } = CLI({
  name: 'punch',
  version: package.version,
});

// Process command line args into params/flags

process.argv.slice(2).forEach(arg => {
  if (arg[0] === '-') {
    switch (arg.toLowerCase()) {
    case '-v':
    case '--verbose':
      flags.VERBOSE = true;
      break;
    }
  }
});

if (flags.VERBOSE) {
  console.log({ params: process.argv.slice(2), flags });
}

const config = require('./files/config')();
const syncer = require('./sync/syncer')(config, flags);
const puncher = require('./files/puncher')(config, flags);
const invoicer = require('./invoicing/invoicer')(config, flags);
const datefmt = require('./formatting/time');
const durationfmt = require('./formatting/duration');
const resolvePath = require('./utils/resolvepath');

const { autoSync } = config.sync;

/*=========================*\
||          Utils          ||
\*=========================*/

const getLabelFor = param => {
  const project = config.projects.find(p => p.alias === param);
  if (project) {
    return project.name;
  } else {
    return param;
  }
};

const getRateFor = proj => {
  const project = config.projects.find(p => p.alias === proj);
  if (project) {
    return project.hourlyRate;
  } else {
    return 0;
  }
}

const confirm = question => {
  let response;

  while (!['y', 'n', 'yes', 'no'].includes(response)) {
    response = readline.question(`${question} [y/n]`).toLowerCase().trim();

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

/*
  required param: 'in :project'
  optional param: 'in :project?'
  splat (rest): 'report *when'
  optional splat: 'report *when?'
*/

command('in :project', 'start tracking time on a project', (args) => {

  const { project } = args;

  const current = puncher.currentSession();

  if (current) {
    return console.log(`You're already punched in on ${getLabelFor(project)}! Punch out first.`);
  } else {
    const time = datefmt.time(Date.now());
    puncher.punchIn(project);
    console.log(`Punched in on ${getLabelFor(project)} at ${time}.`);
    if (autoSync) { syncer.sync(); }
  }

});

command('out *comment?', 'stop tracking time and record an optional description of tasks completed', (args) => {

  const { comment } = args;

  const current = puncher.currentSession();
  
  if (current) {
    const label = getLabelFor(current.project);
    const time = datefmt.time(Date.now());
    const duration = Date.now() - current.in;
    const pay = duration / 1000 / 60 / 60 * getRateFor(current.project);

    puncher.punchOut(comment);
    console.log(`Punched out on ${label} at ${time}. Worked for ${durationfmt(duration)} and earned \$${pay.toFixed(2)}.`);
    if (autoSync) { syncer.sync(); }
  } else {
    console.log(`You're not punched in!`);
  }

});

command('rewind :amount', 'subtract payable time from a project to account for breaks and interruptions', (args) => {

  const current = puncher.currentSession();
  const { amount } = args;

  if (current) {
    puncher.rewind(amount);
    console.log(`Rewound by ${amount} on current ${getLabelFor(current.project)} session.`);
    if (autoSync) {
      syncer.sync();
    }
  } else {
    console.log('You\'re not currently punched in. Do you want to apply this rewind to the previous session?');
    console.log('[NOT IMPLEMENTED] Get user input (y/n)');
  }

});

command('create :project :timeIn :timeOut :comment?', 'create a punch', (args) => {

  const { project, timeIn, timeOut, comment } = args;
  
  let punchIn, punchOut;
  try {
    punchIn = moment(timeIn, 'MM-DD-YYYY@hh:mmA');
    punchOut = moment(timeOut, 'MM-DD-YYYY@hh:mmA');
  } catch (err) {
    console.log('Please enter dates formatted as \'mm-dd-yyyy@hours:minutesAM\'');
  }

  if (!punchIn.isValid() || !punchOut.isValid()) {
    return console.log('Please enter dates formatted as \'mm-dd-yyyy@hours:minutesAM\'');
  }

  const proj = config.projects.find(p => p.alias === project);
  const duration = punchOut - punchIn;
  let pay;
  if (proj && proj.hourlyRate) {
    pay = '$' + (duration / 3600000 * proj.hourlyRate).toFixed(2);
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
    puncher.createPunch(project, punchIn.valueOf(), punchOut.valueOf(), comment);
    console.log('Punch created');
  } else {
    console.log('Punch not created');
  }

});

command('purge :project', 'destroy all punches for a given project', (args) => {

  const { project } = args;
  
  const { found, time, days } = puncher.purgeProject(project);
  const label = getLabelFor(project);

  if (found === 0) {
    return console.log(`Project '${label}' has no entries.`);
  }

  if (confirm(`Purge ${found} entries over ${days} days with a total time of ${durationfmt(time)} for project '${label}'?`)) {
    puncher.purgeProject(project, false);
    console.log(`Purged project ${label}`);
  } else {
    console.log('Your entries are safe.');
  }

});

command('now', 'show the status of the current session', () => {

  const current = puncher.currentSession();
  if (current) {
    const duration = Date.now() - current.in;
    const pay = duration / 1000 / 60 / 60 * getRateFor(current.project);
    const punchedIn = datefmt.time(current.in);
    console.log(`You punched in on ${getLabelFor(current.project)} at ${punchedIn} and have been working for ${durationfmt(duration)} (\$${pay.toFixed(2)}).`);
  } else {
    console.log('No current session.');
  }

});

command('projects', 'show a list of all projects in your config file', () => {

  console.log('[NOT IMPLEMENTED] List all projects from config file');

});

command('today', 'show a summary of today\'s punches (shorthand for "punch report today")', () => {

  invoke('report today');

});

command('yesterday', 'show a summary of yesterday\'s punches (short for "punch report yesterday")', () => {

  invoke('report yesterday');

});

command('report *when?', 'show a summary of punches for a given period', (args) => {

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

command('invoice :project :startDate :endDate :outputFile', 'automatically generate an invoice using punch data', (args) => {

  let { project, startDate, endDate, outputFile } = args;
  const projectData = config.projects.find(p => p.alias === project);
  if (!projectData) {
    return console.log(`Can't invoice for '${alias}'. Make sure the project is in your config file.`);
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
  
  str += `       Project: ${projectData.name || alias}\n`;
  str += `    Start Date: ${startDate.format('dddd, MMM Do YYYY')}\n`;
  str += `      End Date: ${endDate.format('dddd, MMM Do YYYY')}\n`;
  str += `Invoice Format: ${format}\n`;
  str += `     Output To: ${resolvePath(outputFile)}\n`

  console.log(str);

  let response;
  
  if (confirm('Create invoice?')) {
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

command('sync *provider?', 'synchronize with any providers you have configured', () => {
  syncer.sync();
});

run(process.argv.slice(2));