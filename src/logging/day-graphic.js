const startOfDay = require('date-fns/start_of_day')
const closestIndexTo = require('date-fns/closest_index_to')
const chalk = require('chalk')

// const onChar = '■'
// const onChar = '▓'
// const offChar = '░'

const onChar = '▊'
const offChar = chalk.level > 0 ? chalk.grey('▊') : '-'


const lineLength = 48
const colors = [
  // 'red',
  // 'yellow',
  // 'green',
  // 'blue',
  // 'cyan',
  // 'red',
  // 'magenta',
  'white'
]

module.exports = function ({ punches, date, labelPadding, config }) {

  const topRow = '12    03    06    09    12    15    18    21    '

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
        line
      }
    }
    projects[name].punches.push(punch)
  }

  const inc = lineLength / 24;
  const increments = []
  let start = startOfDay(date)

  for (let i = 0; i < lineLength; i++) {
    start.setHours(Math.round(i / inc))
    increments.push(new Date(start))
  }

  let longestName = 0

  // Calculate each project's line.
  for (const project in projects) {
    if (project.length > longestName) {
      longestName = project.length
    }

    for (const punch of projects[project].punches) {
      const start = Math.max(0, Math.min(lineLength, closestIndexTo(punch.in, increments)))
      const end = Math.max(0, Math.min(lineLength, closestIndexTo(punch.out || new Date(), increments)))
      const p = projects[project]

      for (let i = start; i <= end; i++) {
        p.line[i] = onChar;
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

    str += `${project}`.padEnd(labelPadding)
    str += p.line.join('') + '\n'
  }

  return str
}