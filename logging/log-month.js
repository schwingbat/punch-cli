module.exports = function ({ config, punches, date, summary, project }) {
  const moment = require('moment')
  const chalk = require('chalk')
  const Duration = require('../time/duration')
  const currency = require('../format/currency')
  const format = require('../format/format')

  const {
    reportHeader,
    projectHeader,
    projectDay,
    summaryTable,
    delimitedList
  } = require('./printing')

  let projects = {}
  const projName = project
  punches.forEach(punch => {
    if (project && punch.project !== project) return

    if (!projects[punch.project]) {
      projects[punch.project] = {
        name: punch.project,
        time: 0,
        rewind: 0,
        sessions: []
      }
    }

    let end = punch.out || Date.now()

    projects[punch.project].time += end - punch.in;
    projects[punch.project].sessions.push({
      start: format.time(punch.in),
      end: punch.out ? format.time(punch.out) : "Now",
      startStamp: punch.in,
      time: end - punch.in,
      comments: punch.comments || [punch.comment],
      duration: new Duration(end - punch.in).toString(),
    })
  })

  let dayTime = 0
  let dayPay = 0
  let paidTime = 0
  for (const name in projects) {
    const proj = config.projects[name];
    dayTime += projects[name].time;
    if (proj && proj.hourlyRate) {
      dayPay += projects[name].time / 1000 / 60 / 60 * proj.hourlyRate;
      paidTime += projects[name].time;
    }
  }

  const projArr = [];

  for (const name in projects) {
    const proj = config.projects[name];

    let pay;
    if (proj && proj.hourlyRate) {
      pay = projects[name].time / 1000 / 60 / 60 * proj.hourlyRate;
      projects[name].hourlyRate = proj.hourlyRate;
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
    // Descending by time spent
    return +(a.billableTime < b.billableTime);

    // Descending by money
    // return +(a.totalPay > b.totalPay);
  }).forEach(project => {
    let pay;
    if (project.totalPay) pay = currency(project.totalPay);

    console.log(projectHeader(
      project.fullName,
      [
        new Duration(project.billableTime).toString(),
        pay,
        project.hourlyRate
          ? currency(project.hourlyRate) + '/hr'
          : null
      ]
    ));
    console.log()

    // Sort sessions by day
    let sessionsByDay = {};

    project.sessions.forEach(session => {
      const day = moment(session.startStamp).date();
      if (!sessionsByDay[day]) sessionsByDay[day] = [];
      sessionsByDay[day].push(session);
    });

    for (const day in sessionsByDay) {
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

      console.log(projectDay({
        date: moment(sessionsByDay[day][0].startStamp),
        stats: [
          new Duration(sum.time).toString(),
          sum.pay
            ? currency(sum.pay)
            : null
          ],
        sessions: sum.sessions
      }));
    }
  });

  console.log(summaryTable(summary))

  // const projectTable = table({
  //   rows: projArr.map(p => [
  //     chalk.yellow(p.fullName),
  //     format.duration(p.billableTime),
  //     format.currency(p.totalPay),
  //     p.hourlyRate
  //       ? format.currency(p.hourlyRate) + '/hr'
  //       : 'N/A'
  //   ])
  // })

  // console.log(projectTable)

  // console.log(
  //   '\n' + chalk.bold.cyan(moment(date).format('MMMM YYYY')),
  //   delimitedList(
  //     [
  //       format.duration(dayTime),
  //       format.currency(dayPay)
  //     ],
  //     ' / ',
  //     ['(', ')']
  //   )
  // )
}
