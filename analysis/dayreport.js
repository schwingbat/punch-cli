const datefmt = require('../formatting/time');
const durationfmt = require('../formatting/duration');

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

  console.log(`\nWORK FOR ${datefmt.date(date)} (${durationfmt(dayTime)} / \$${dayPay.toFixed(2)})\n`);

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

    console.log(`${project.fullName} (${durationfmt(project.billableTime)}${pay ? ' / ' + pay : ''})`);

    console.log();
    project.sessions.sort((a, b) => {
      // Chronological ascending
      return +(a.startStamp > b.startStamp);
    }).forEach(session => {
      let str = '  ';
      str += session.timeSpan.toUpperCase() + ' ';
      str += '(';
      str += session.duration;
      if (session.pay) str += ' / $' + session.pay.toFixed(2);
      str += ')';
      if (session.comment) str += '\n        -> ' + session.comment;
      console.log(str);
    });
    console.log();
  });
}