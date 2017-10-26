#!/usr/bin/env node

const config = require('./files/config')();
const puncher = require('./files/puncher')(config);
const reporter = require('./analysis/reporter')(config);
const datefmt = require('./formatting/time');
const durationfmt = require('./formatting/duration');

const command = process.argv[2];
const params = process.argv.slice(3);

if (command == null) {
  return cmdHelp();
}

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

/*=========================*\
||      Parse/Dispatch     ||
\*=========================*/

switch (command.toLowerCase()) {
case 'in':
  return cmdIn();
case 'out':
  return cmdOut();
case 'rewind':
  return cmdRewind();
case 'time':
case 'now':
  return cmdNow();
case 'sessions':
  return cmdSessions();
case 'projects':
  return cmdProjects();
default:
  console.error(`Unrecognized command: ${command}`);
  return cmdHelp();
}

/*=========================*\
||         Commands        ||
\*=========================*/

async function cmdIn() {
  // Begin a session.
  const [project] = params;

  if (!project) {
    return console.log(`Can't punch in without a project name. Try: 'punch in [project]'`);
  }

  const current = puncher.currentSession();

  if (current) {
    const label = getLabelFor(current.project);
    return console.log(`You're already punched in on ${label}! Punch out first.`);
  } else {
    const time = datefmt.time(Date.now());
    const label = getLabelFor(project);
    puncher.punchIn(project);
    console.log(`Punched in on ${label} at ${time}.`);
  }
}

async function cmdOut() {
  // End a session.
  const current = puncher.currentSession();

  if (current) {
    const [comment] = params;
    const label = getLabelFor(current.project);
    const time = datefmt.time(Date.now());
    const duration = Date.now() - current.in;
    const pay = duration / 1000 / 60 / 60 * getRateFor(current.project);

    puncher.punchOut(comment);
    console.log(`Punched out on ${label} at ${time}. Worked for ${durationfmt(duration)} and earned \$${pay.toFixed(2)}.`);
  } else {
    console.log(`You're not punched in!`);
  }
}

function cmdRewind() {
  const current = puncher.currentSession();
  const [amount] = params;

  if (current) {
    puncher.rewind(amount);
    console.log(`Rewound by ${amount} on current ${getLabelFor(current.project)} session.`);
  } else {
    console.log('You\'re not currently punched in. Do you want to apply this rewind to the previous session?');
    console.log('[NOT IMPLEMENTED] Get user input (y/n)');
  }
}

function cmdNow() {
  const session = puncher.currentSession();
  if (session) {
    console.log('Session', session);
  } else {
    console.log('No current session.');
  }
  // console.log('[NOT IMPLEMENTED] Show current project and time elapsed since punch in');
}

function cmdSessions() {
  puncher.sessionsByProject();
}

function cmdProjects() {
  console.log('[NOT IMPLEMENTED] List all projects from config file');
}

function cmdHelp() {
  console.log('[NOT IMPLEMENTED] Show help');
}