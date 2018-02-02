module.exports = function(config, punches, date, project) {
  const format = require('../utils/format');
  const moment = require('moment');
  const chalk = require('chalk');

  const { reportHeader, projectHeader, daySessions } = require('./printing');

  date = moment(date);

  if (punches.length === 0) {
    return console.log('\n' + chalk.bold.white('▋  No sessions for ' + date.format('MMMM Do YYYY')) + '\n');
  }

  let projects = {};
  punches.forEach(punch => {
    if (project && punch.project !== project) return;

    if (!projects[punch.project]) projects[punch.project] = {
      name: punch.project,
      time: 0,
      rewind: 0,
      sessions: [],
    }

    let end = punch.out || Date.now();

    projects[punch.project].time += end - punch.in;
    projects[punch.project].sessions.push({
      start: format.time(punch.in),
      end: punch.out ? format.time(punch.out) : "Now",
      startStamp: punch.in,
      time: end - punch.in,
      comments: punch.comments || [punch.comment],
      duration: format.duration(end - punch.in),
    });
  });

  let dayTime = 0;
  let dayPay = 0;
  for (const name in projects) {
    const proj = config.projects.find(p => p.alias === name);
    dayTime += projects[name].time;
    if (proj && proj.hourlyRate) {
      dayPay += projects[name].time / 1000 / 60 / 60 * proj.hourlyRate;
    }
  }

  console.log(reportHeader(
    'Work for ' + date.format('MMMM Do YYYY'),
    [format.duration(dayTime), dayPay ? format.currency(dayPay) : null]
  ));

  const projArr = [];

  for (const name in projects) {
    const proj = config.projects.find(p => p.alias === name);

    let pay;
    if (proj && proj.hourlyRate) {
      pay = projects[name].time / 1000 / 60 / 60 * proj.hourlyRate;
    }

    projects[name].fullName = proj && proj.name ? proj.name : name;
    projects[name].billableTime = projects[name].time - projects[name].rewind;
    projects[name].totalPay = pay;

    projects[name].sessions.map(session => {
      session.timeSpan = session.start.padStart(8) + ' - ' + session.end.padStart(8);
      let sessionPay;
      if (proj && proj.hourlyRate) {
        sessionPay = session.time / 1000 / 60 / 60 * proj.hourlyRate;
      }
      session.pay = sessionPay;
      return session;
    });

    projArr.push(projects[name]);
  }

  projArr.sort((a, b) => {
    // Descending by time
    return +(a.billableTime < b.billableTime);

    // Descending by money
    // return +(a.totalPay > b.totalPay);
  }).forEach(project => {
    // console.log(project);
    let pay;
    if (project.totalPay) pay = format.currency(project.totalPay);

    console.log(projectHeader(
      project.fullName,
      [format.duration(project.billableTime), pay]
    ));

    const sessions = project.sessions.sort((a, b) => {
      // Chronological ascending
      return +(a.startStamp > b.startStamp);
    });

    console.log(daySessions(sessions));
  });
  console.log();
}
