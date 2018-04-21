module.exports = function ({ config, punches, date, summary, project }) {
  const Duration = require('../time/duration')
  const moment = require('moment')
  const chalk = require('chalk')
  const { ascendingBy } = require('../utils/sort-factories')

  const { dayPunches, summaryTable } = require('./printing')

  /*
    Show punches chronologically in this format:
      11:45am - 5:52pm [BidPro Admin] >> some comment here
                                      >> other comment here
       6:12pm - 8:15pm [SCC Graphics] >> finished poster
       8:20pm - 1:27am [BidPro]       >> some comment here
  */

  date = moment(date)

  if (punches.length === 0) {
    return console.log('\n' + chalk.bold.white('No sessions for ' + date.format('MMMM Do YYYY')))
  }

  punches = punches
    .filter(punch => !project || punch.project !== project)
    .sort(ascendingBy('in'))
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
        duration: new Duration(punchOut - punchIn).toString(),
      }
    })

  console.log()
  console.log(dayPunches(punches, summary, config))
  console.log(summaryTable(summary))
  console.log()
}
