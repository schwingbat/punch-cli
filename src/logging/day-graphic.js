const startOfDay = require('date-fns/start_of_day')
const closestIndexTo = require('date-fns/closest_index_to')
const chalk = require('chalk')

const onChar = '■'
const offChar = '░'
const lineLength = 48
const colors = [
  'red',
  'yellow',
  'green',
  'blue',
  'cyan',
  'red',
  'magenta',
  'white'
]

function shuffle(a) {
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      x = a[i];
      a[i] = a[j];
      a[j] = x;
  }
  return a;
}

module.exports = function ({ punches, date, labelPadding, config }) {

  const topRow = '12    03    06    09    12    03    06    09    '

  const projects = {}

  for (const punch of punches) {
    const name = config.projects[punch.project] && config.projects[punch.project].name
    if (!projects[name]) {
      let line = []
      for (let i = 0; i < lineLength; i++) {
        line.push(chalk.grey(offChar))
      }

      projects[name] = {
        label: name,
        punches: [],
        color: 'cyan',
        line
      }
    }
    projects[name].punches.push(punch)
  }

  const increments = []
  let start = startOfDay(date)

  for (let i = 0; i < lineLength; i++) {
    start.setHours(i / (lineLength / 24))
    increments.push(new Date(start))
  }

  let longestName = 0
  let col = colors.map(c => c)

  // Calculate each project's line.
  for (const project in projects) {
    if (project.length > longestName) {
      longestName = project.length
    }

    const color = col.shift()
    if (col.length === 0) {
      col = colors.map(c => c)
    }
    projects[project].color = color

    for (const punch of projects[project].punches) {
      const start = Math.max(0, Math.min(lineLength, closestIndexTo(punch.in, increments)))
      const end = Math.max(0, Math.min(lineLength, closestIndexTo(punch.out || new Date(), increments)))
      const p = projects[project]

      for (let i = start; i <= end; i++) {
        p.line[i] = chalk[color](onChar);
      }
    }
  }

  if (!labelPadding) {
    labelPadding = longestName + 3
  }

  let str = ''

  str += ''.padEnd(labelPadding)
  str += topRow + '\n'
  
  for (const project in projects) {
    const p = projects[project]

    str += chalk[p.color](`${project}`.padEnd(labelPadding))
    str += p.line.join('') + '\n'
  }

  return str
}