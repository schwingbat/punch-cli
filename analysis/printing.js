/*
  Contains all the reusable methods for producing
  different headers and entries for reports.
*/

const chalk = require('chalk')
const moment = require('moment')
const format = require('../utils/format')

function table(opts) {
  const { header, rows } = opts
  const padding = ''.padEnd(opts.padding || 3)
  const columnCount = rows[0].length
  const colWidths = []

  for (let i = 0; i < columnCount; i++) {
    let max = 0

    for (let r = 0; r < rows.length; r++) {
      const { length } = rows[r][i].toString()
      if (length > max) {
        max = length
      }
    }

    if (header) {
      const { length } = header[i].toString()
      if (length > max) {
        max = length
      }
    }

    colWidths[i] = max
  }

  let head
  if (header) {
    head = header.map((h, i) => {
      console.log(i, h, colWidths[i])
      return chalk.bold(h.toString().padEnd(colWidths[i], '.'))
    }).join(padding)  
  }
  
  const body = rows.map(row => {
    return row.map((column, i) => {
      return column.toString().padEnd(colWidths[i])
    }).join(padding)
  }).join('\n')

  return head ? (head + '\n') : '' + body
}

function delimitedList(items, inners = ' / ', outers) {
  let joined = items.filter(i => i).join(chalk.grey(inners))
  if (outers) {
    joined = chalk.grey(outers[0]) + joined + chalk.grey(outers[1])
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

  str += /*'▋  ' + */' ' + chalk.bold(text) + '\n'
  if (stats) {
    str += /*'▋  ' + */' ' + delimitedList(stats)
  }

  return str
}

function projectHeader(text, stats) {
  let str = '';

  str += chalk.bold.yellow(/*'▋  ' + */ ' ' + text);
  if (stats) {
    str += ' ' + delimitedList(stats.filter(s => s).map(s => s.toString()), true);
  }

  return str;
};

function daySessions(sessions) {
  let str = '';

  sessions.forEach(session => {
    str += '     ';

    if (session.timeSpan.slice(session.timeSpan.length - 3).toLowerCase() === 'now') {
      str += chalk.green.bold.italic(session.timeSpan);
    } else {
      str += chalk.cyan.bold.italic(session.timeSpan);
    }

    if (session.comments.length > 0) {
      for (let i = 0; i < session.comments.length; i++) {
        const c = session.comments[i];
        if (!c) continue;

        if (i > 0) {
          str += '\n                        ' + chalk.grey(' » ') + c;
        } else {
          str += chalk.grey(' » ') + c;
        }
      }
    }

    str += '\n';
  });

  return str;
}

function dayPunches(punches, projects, config) {
  let str = ''

  let timeIndent = 0

  for (let i = 0; i < punches.length; i++) {
    const punch = punches[i]
    const start = moment(punch.in).format(config.timeFormat).padStart(7)
    const end = (punch.current ? 'Now' : moment(punch.out).format(config.timeFormat)).padStart(7)
    const timeSpan = `${start} - ${end}`
    const duration = format.duration(punch.out.diff(punch.in))
    const pay = projects[punch.project].rate * punch.out.diff(punch.in, 'hours', true)
    const timeLength = start.length + end.length + 4

    // str += '     ';

    if (punch.current) {
      str += chalk.green.bold.italic(timeSpan);
    } else {
      str += chalk.cyan.bold.italic(timeSpan);
    }

    str += chalk.yellow(` » ${projects[punch.project].name || punch.project}`)

    str += '\n '

    const durPay = delimitedList([duration, format.currency(pay)], ' / ', ['(', ')'])
    timeIndent = Math.max(durPay.length + 1, timeIndent)

    str += ` ${durPay}`.padEnd(timeIndent)

    // str += '\n    '

    if (punch.comments.length > 0) {
      for (let i = 0; i < punch.comments.length; i++) {
        const c = punch.comments[i];
        if (!c) continue;

        if (i > 0) {
          str += '\n'.padEnd(timeLength) + chalk.grey(' » ') + c;
        } else {
          str += chalk.grey(' » ') + c;
        }
      }
    }

    str += '\n';
  }

  return str;
}

function dayProjectSummaries(projects) {
  let str = ''

  // console.log(projects)

  let total = {
    hours: 0,
    pay: 0,
    sessions: 0,
  }

  const tableItems = []

  for (const name in projects) {
    const project = projects[name]
    const hours = project.time / 1000 / 60 / 60
    total.hours += hours
    total.pay += project.pay
    total.sessions += project.sessions

    tableItems.push([
      chalk.yellow(project.name),
      format.duration(project.time),
      format.currency(project.pay),
      project.sessions + ' punch' + (project.sessions === 1 ? '' : 'es')
    ])
  }

  console.log(table({ rows: tableItems }))

  str += '\n' + chalk.bold.cyan('TOTAL') + ' '
  str += delimitedList([
    total.hours.toFixed(1) + 'h',
    format.currency(total.pay),
    total.sessions + ' punches'
  ], ' / ', ['(', ')'])

  return str
}

function projectDay({ date, stats, sessions }) {
  let str = '';

  str += chalk.grey('   ▶ ') + chalk.white.bold(date.format('MMM Do, dddd'));
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
  dayProjectSummaries,
  projectHeader,
  projectDay,
  projectSummary,
};