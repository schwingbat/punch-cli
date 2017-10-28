const datefmt = require('../formatting/time');
const durationfmt = require('../formatting/duration');
const moment = require('moment');

module.exports = function(config, punches, date, project) {
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
      start: datefmt.dateTime(punch.in),
      end: punch.out ? datefmt.dateTime(punch.out) : "Now",
      startStamp: punch.in,
      time: end - punch.in,
      comment: punch.comment,
      duration: durationfmt(end - punch.in),
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

  console.log(`\nWORK FOR ${moment(date).format('MMMM YYYY').toUpperCase()} (${durationfmt(dayTime)} / \$${dayPay.toFixed(2)})`);

  const projArr = [];

  for (const name in projects) {
    const proj = config.projects.find(p => p.alias === name);

    let pay;
    if (proj && proj.hourlyRate) {
      pay = projects[name].time / 1000 / 60 / 60 * proj.hourlyRate;
    }

    projects[name].fullName = proj.name || name;
    projects[name].billableTime = projects[name].time - projects[name].rewind;
    projects[name].totalPay = pay;
    
    projects[name].sessions.map(session => {
      session.timeSpan = session.start.split(' ').pop() + ' - ' + session.end.split(' ').pop(); 
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
    if (project.totalPay) pay = '$' + project.totalPay.toFixed(2);

    console.log(`\n${project.fullName} (${durationfmt(project.billableTime)}${pay ? ' / ' + pay : ''})\n`);

    // Sort sessions by day
    let sessionsByDay = {};

    project.sessions.forEach(session => {
      const day = moment(session.startStamp).date();
      if (!sessionsByDay[day]) sessionsByDay[day] = [];
      sessionsByDay[day].push(session);
    });

    for (const day in sessionsByDay) {
      let dayDate = moment(sessionsByDay[day][0].startStamp);
      const sum = {
        time: 0,
        pay: 0,
        comments: [],
      };

      sessionsByDay[day].forEach(session => {
        sum.time += session.time;
        sum.pay += session.pay;
        if (session.comment) sum.comments.push(session.comment);
      });

      let line = '  ' + dayDate.format('dddd, MMM Do') + ' (';
      line += durationfmt(sum.time);
      if (sum.pay) {
        line += ' / $' + sum.pay.toFixed(2);
      }
      line += ')';
      console.log(line);

      sum.comments.forEach(comment => {
        console.log('      -> ' + comment);
      });
      // if (sum.comments.length !== 0) console.log();
    }
  });
  console.log();
}