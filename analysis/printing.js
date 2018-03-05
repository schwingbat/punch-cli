/*
  Contains all the reusable methods for producing
  different headers and entries for reports.
*/

const moment = require('moment')
const format = require('../utils/format')
const table = require('../printing/table')

function delimitedList(items, inners = ' / ', outers) {
  let joined = items.filter(i => i).join(format.text(inners, ['grey']))
  if (outers) {
    joined = format.text(outers[0], ['grey']) + joined + format.text(outers[1], ['grey'])
  }
  return joined
}

const labelTable = (items) => {
  let str = ''
  let length = items.reduce(
      (longest, item) =>
        item.label && item.label.length > longest
          ? item.label.length
          : longest,
        0)

  items.forEach(({ label, value }) => {
    if (!label) {
      str += '   ' + value + '\n';
    } else {
      str += `   ${(label + ':').padStart(length + 2)} ${value}\n`
    }
  })

  return str
}

function reportHeader(text, stats) {
  let str = '\n';

  str += /*'▋  ' + */' ' + format.text(text, ['bold']) + '\n'
  if (stats) {
    str += /*'▋  ' + */' ' + delimitedList(stats)
  }

  return str
}

function projectHeader(text, stats) {
  let str = ''

  str += format.text(' ' + text, ['bold', 'yellow'])
  if (stats) {
    str += ' ' + delimitedList(stats.filter(s => s).map(s => s.toString()), ' / ', ['(', ')'])
  }

  return str
};

function daySessions(sessions) {
  let str = '';

  sessions.forEach(session => {
    str += '     ';

    if (session.timeSpan.slice(session.timeSpan.length - 3).toLowerCase() === 'now') {
      str += format.text(session.timeSpan, ['green', 'bold'])
    } else {
      str += format.text(session.timeSpan, ['cyan'])
    }

    if (session.comments.length > 0) {
      for (let i = 0; i < session.comments.length; i++) {
        const c = session.comments[i];
        if (!c) continue;

        if (i > 0) {
          str += '\n                        ' + format.text(' » ', ['grey']) + c;
        } else {
          str += format.text(' » ', ['grey']) + c;
        }
      }
    }

    str += '\n';
  });

  return str;
}

function dayPunches(punches, projects, config) {
  let str = ''
  // const nameLength = punches.reduce((max, punch) => {
  //   return Math.max(projects[punch.project].name.length, max)
  // }, 0)

  for (let i = 0; i < punches.length; i++) {
    const punch = punches[i]
    const start = moment(punch.in).format(config.timeFormat).padStart(7)
    const end = (punch.current ? 'Now' : moment(punch.out).format(config.timeFormat)).padStart(7)
    const timeSpan = `${start} - ${end}`

    if (punch.current) {
      str += format.text(timeSpan, ['green', 'bold'])
    } else {
      str += format.text(timeSpan, ['cyan'])
    }

    str += format.text(` [${projects[punch.project].name || punch.project}]`, ['yellow'])
    str += '\n'

    if (punch.comments.length > 0) {
      for (let i = 0; i < punch.comments.length; i++) {
        const c = punch.comments[i]

        if (c) {
          str += format.text('   ⸭ ', ['grey']) + c

          if (punch.comments[i + 1]) {
            str += '\n'
          }
        }
      }
      str += '\n'
    }
  }

  return str;
}

/* Takes an object like so:
{
  punch: {
    name: "Punch",
    time: 91902831,
    pay: 89.00,
    punches: 2
  },
  dash: {
    ...
  }
}
*/
function summaryTable(projects) {
  let str = ''

  let total = {
    hours: 0,
    time: 0,
    pay: 0,
    punches: 0,
  }

  let projectArray = []

  for (const name in projects) {
    projects['key'] = name
    projectArray.push(projects[name])
  }

  projectArray.sort((a, b) => {
    // Sort by time spent
    a.time > b.time ? 1 : -1
  })

  const tableItems = []

  for (let i = 0; i < projectArray.length; i++) {
    const name = projectArray[i].key
    const project = projectArray[i]
    const hours = project.time / 1000 / 60 / 60
    total.hours += hours
    total.time += project.time
    total.pay += project.pay
    total.punches += project.punches

    tableItems.push([
      format.text(project.name, ['yellow']),
      format.duration(project.time),
      format.currency(project.pay),
      project.punches + ' punch' + (project.punches === 1 ? '' : 'es')
    ])
  }

  console.log(table({ rows: tableItems }))

  str += '\n' + format.text('TOTAL', ['bold', 'cyan']) + ' '
  str += delimitedList([
    format.duration(total.time),
    format.currency(total.pay),
    total.punches + ' punch' + (total.punches === 1 ? '' : 'es')
  ], ' / ', ['(', ')'])

  return str
}

function projectDay({ date, stats, sessions }) {
  let str = '';

  str += format.text('   ⸭ ', ['grey']) + format.text(date.format('MMM Do, dddd'), ['white', 'bold']);
  if (stats) {
    str += ' ' + delimitedList(stats, ' / ', ['(', ')']) + '\n';
  }

  str += daySessions(sessions);

  return str;
};

function projectSummary({ name, pay, time, rate, stats }) {
  let str = '';
  const statList = [time];

  if (pay) statList.push(pay);
  if (rate) statList.push(rate);

  str += projectHeader(name) + ' ' + slashList(statList, true) + '\n\n';

  if (stats) {
    str += labelTable(stats);
  }

  return str;
};

module.exports = {
  table,
  delimitedList,
  labelTable,
  reportHeader,
  daySessions,
  dayPunches,
  summaryTable,
  projectHeader,
  projectDay,
  projectSummary,
};