module.exports = function ({ config, punches, date, summary, project }) {
  const { ascendingBy } = require('../utils/sort-factories')
  const { dayPunches, summaryTable } = require('./printing')

  /*
    Show punches chronologically in this format:
      11:45am - 5:52pm [BidPro Admin] >> some comment here
                                      >> other comment here
       6:12pm - 8:15pm [SCC Graphics] >> finished poster
       8:20pm - 1:27am [BidPro]       >> some comment here
  */

  if (punches.length === 0) {
    return console.log('\n' + 'No sessions for ' + date.toFormat(config.dateFormat))
  }

  punches = punches
    .filter(punch => !project || punch.project !== project)
    .sort(ascendingBy('in'))

  console.log()
  console.log(dayPunches(punches, summary, config))
  console.log(summaryTable(summary))
  console.log()
}
