module.exports = function(project) {
  // Turn the detailed object into an array of formatted stats.

  const format = require('../utils/format');
  const moment = require('moment');
  const chalk = require('chalk');

  const {
    fullName,
    totalTime,
    totalPay,
    hourlyRate,
    totalPunches,
    firstPunch,
    latestPunch,
  } = project;

  let lastActive = latestPunch.out
    ? moment(latestPunch.out).fromNow()
    : chalk.bold.green('Now');

  return {
    name: fullName,
    pay: totalPay ? format.currency(totalPay) : null,
    time: format.duration(totalTime),
    rate: hourlyRate ? format.currency(hourlyRate) + '/hr' : null,
    stats: [
      { label: 'Punches', value: totalPunches },
      { label: 'Started', value: moment(firstPunch.in).format('MMM Do, YYYY') },
      { label: 'Last active', value: lastActive },
      // { label: 'Average time per day', value: moment(firstPunch.in). }
    ]
  };
};