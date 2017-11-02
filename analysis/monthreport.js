const datefmt = require('../formatting/time');
const durationfmt = require('../formatting/duration');
const moment = require('moment');

module.exports = function(config, punches, date, project) {
  let projects = {};
  const projName = project;
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
  let paidTime = 0;
  for (const name in projects) {
    const proj = config.projects.find(p => p.alias === name);
    dayTime += projects[name].time;
    if (proj && proj.hourlyRate) {
      dayPay += projects[name].time / 1000 / 60 / 60 * proj.hourlyRate;
      paidTime += projects[name].time;
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

    projects[name].fullName = proj && proj.name ? proj.name : name;
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

    if (false && !projName && Object.keys(sessionsByDay).length > 7) {
      let byWeek = {};
      for (const day in sessionsByDay) {
        let dayDate = moment(sessionsByDay[day][0].startStamp);
        const weekNum = dayDate.week();
        const wDate = moment(sessionsByDay[day][0].startStamp);
        const wEndDate = moment(sessionsByDay[day][0].startStamp);
        wDate.set('day', 1);
        wEndDate.set('day', 7);
        if (!byWeek[weekNum]) byWeek[weekNum] = {
          title: wDate.format('MMM Do') + ' - ' + wEndDate.format('MMM Do'),
          time: 0,
          pay: 0,
          comments: []
        };

        const week = byWeek[weekNum];
        sessionsByDay[day].forEach(session => {
          week.time += session.time;
          week.pay += session.pay;
          if (session.comment) week.comments.push(session.comment);
        });
      }

      for (const week in byWeek) {
        const w = byWeek[week];
        let line = '  ' + w.title + ' (';
        line += durationfmt(w.time);
        if (w.pay) {
          line += ' / $' + w.pay.toFixed(2);
        }
        line += ')';
        console.log(line);
        w.comments.forEach(comment => {
          console.log('      -> ' + comment);
        });
      }
    } else {
      for (const day in sessionsByDay) {
        let dayDate = moment(sessionsByDay[day][0].startStamp);
        const sum = {
          time: 0,
          pay: 0,
          sessions: [],
        };

        sessionsByDay[day].forEach(session => {
          sum.time += session.time;
          sum.pay += session.pay;
          sum.sessions.push(session);
        });
  
        let line = '  ' + dayDate.format('dddd, MMM Do') + ' (';
        line += durationfmt(sum.time);
        if (sum.pay) {
          line += ' / $' + sum.pay.toFixed(2);
        }
        line += ')';
        console.log(line);

        sum.sessions.forEach(session => {
          console.log('      ' + session.timeSpan + ' -> ' + session.comment);
        });
        // if (sum.comments.length !== 0) console.log();
      }
    }
  });

  console.log();
  console.log('-------------------------------------------------');
  console.log(`   Average hours per week (paid): ${(paidTime / 3600000 / 4).toFixed(1)}`);
  console.log(`  Average hours per week (total): ${(dayTime / 3600000 / 4).toFixed(1)}`);
  console.log(`              Average $ per hour: \$${(dayPay / (paidTime / 3600000)).toFixed(2)}`);
  console.log(`    % of time spent on paid work: ${(paidTime / dayTime * 100).toFixed()}%`);
  console.log('-------------------------------------------------');
  console.log();
}