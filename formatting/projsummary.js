const moment = require('moment');
const durationfmt = require('./duration');
const timefmt = require('./time');
const currencyfmt = require('./currency');

module.exports = function(project) {
  // Turn the detailed object into an array of formatted stats.

  const {
    fullName,
    totalTime,
    totalPay,
    hourlyRate,
    totalPunches,
    firstPunch,
    latestPunch,
  } = project;

  return {
    name: fullName,
    pay: currencyfmt(totalPay),
    time: durationfmt(totalTime),
    rate: currencyfmt(hourlyRate) + '/hr',
    stats: [
      { label: 'Punches', value: totalPunches },
      { label: 'Started', value: moment(firstPunch.in).format('MMM Do, YYYY') },
      { label: 'Last active', value: moment(latestPunch.out || Date.now()).fromNow() },
      // { label: 'Average time per day', value: moment(firstPunch.in). }
    ]
  };
};