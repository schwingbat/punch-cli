module.exports = function(config, punches, date, project) {
  const format = require('../utils/format')
  const moment = require('moment')
  const chalk = require('chalk')

  const { dayPunches, dayProjectSummaries } = require('./printing')

  /*
    Show punches chronologically in this format:
      11:45am - 5:52pm [BidPro Admin] >> some comment here
                                      >> other comment here
       6:12pm - 8:15pm [SCC Graphics] >> finished poster
  */

  date = moment(date)

  if (punches.length === 0) {
    return console.log('\n' + chalk.bold.white('No sessions for ' + date.format('MMMM Do YYYY')))
  }

  punches = punches
    .filter(punch => !project || punch.project !== project)
    .sort((a, b) => a.in < b.in ? -1 : 1)
    .map(punch => {
      const punchIn = moment(punch.in)
      const punchOut = moment(punch.out || Date.now())

      return {
        project: punch.project,
        current: !punch.out,
        in: punchIn,
        out: punchOut,
        time: punchOut - punchIn,
        comments: punch.comments || [punch.comment],
        duration: format.duration(punchOut - punchIn),
      }
    })

  let projects = punches.reduce((projects, punch) => {
    if (!projects[punch.project]) {
      projects[punch.project] = {
        time: 0,
        sessions: 0,
        pay: 0,
        rate: 0
      }
    }

    projects[punch.project].time += punch.out - punch.in
    projects[punch.project].sessions += 1
    projects[punch.project].name = config.projects[punch.project].name

    return projects
  }, {})

  for (const name in projects) {
    const info = config.projects[name]
    const project = projects[name]

    if (info && info.hourlyRate) {
      project.rate = info.hourlyRate
      project.pay += project.time / 1000 / 60 / 60 * info.hourlyRate
    }
  }


  console.log()
  console.log(dayPunches(punches, projects, config))
  console.log(dayProjectSummaries(projects, config))

  // console.log(reportHeader(
  //   'Work for ' + date.format('MMMM Do YYYY'),
  //   [format.duration(dayTime), dayPay ? format.currency(dayPay) : null]
  // ));

  // const projArr = [];

  // for (const name in projects) {
  //   const proj = config.projects.find(p => p.alias === name);

  //   let pay;
  //   if (proj && proj.hourlyRate) {
  //     pay = projects[name].time / 1000 / 60 / 60 * proj.hourlyRate;
  //   }

  //   projects[name].fullName = proj && proj.name ? proj.name : name;
  //   projects[name].billableTime = projects[name].time - projects[name].rewind;
  //   projects[name].totalPay = pay;

  //   projects[name].sessions.map(session => {
  //     session.timeSpan = session.start.padStart(8) + ' - ' + session.end.padStart(8);
  //     let sessionPay;
  //     if (proj && proj.hourlyRate) {
  //       sessionPay = session.time / 1000 / 60 / 60 * proj.hourlyRate;
  //     }
  //     session.pay = sessionPay;
  //     return session;
  //   });

  //   projArr.push(projects[name]);
  // }

  // projArr.sort((a, b) => {
  //   // Descending by time
  //   return +(a.billableTime < b.billableTime);

  //   // Descending by money
  //   // return +(a.totalPay > b.totalPay);
  // }).forEach(project => {
  //   // console.log(project);
  //   let pay;
  //   if (project.totalPay) pay = format.currency(project.totalPay);

  //   console.log(projectHeader(
  //     project.fullName,
  //     [format.duration(project.billableTime), pay]
  //   ));

  //   const sessions = project.sessions.sort((a, b) => {
  //     // Chronological ascending
  //     return +(a.startStamp > b.startStamp);
  //   });

  //   console.log(daySessions(sessions));
  // });
  console.log();
}
