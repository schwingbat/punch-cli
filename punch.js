const config = require('./files/config')();
const punchfile = require('./files/puncher')(config);
const datefmt = require('./formatting/time');

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

  if (punchfile.isPunchedIn()) {
    const label = getLabelFor(punchfile.currentSession().alias);
    return console.log(`You're already punched in on ${label}! Punch out first.`);
  } else {
    const time = datefmt.time(Date.now());
    const label = getLabelFor(project);
    punchfile.punchIn(project);
    console.log(`Punched in on ${label} at ${time}.`);
  }
}

async function cmdOut() {
  const [comment] = params;

  console.log('Running out. comment:', comment);

  punchfile.punchOut(comment);

  // End a session.
  // if (punchfile.isPunchedIn()) {
  //   const [desc] = params;
  //   const label = getLabelFor(punchfile.currentSession().alias);
  //   const time = datefmt.time(Date.now());

  //   punchfile.punchOut(desc);
  //   console.log(`Punched out on ${label} at ${time}`);
  // }
}

function cmdRewind() {
  console.log('[NOT IMPLEMENTED] Remove a given amount of time from the current session.');
}

function cmdNow() {
  const session = punchfile.currentSession();
  if (session) {
    console.log('Session', session);
  } else {
    console.log('No current session.');
  }
  // console.log('[NOT IMPLEMENTED] Show current project and time elapsed since punch in');
}

function cmdSessions() {
  punchfile.sessionsByProject();
}

function cmdProjects() {
  console.log('[NOT IMPLEMENTED] List all projects from config file');
}

function cmdHelp() {
  console.log('[NOT IMPLEMENTED] Show help');
}