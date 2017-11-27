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
    totalDays,
    totalPunches,
    longestPunch,
    shortestPunch,
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
      { label: 'Avg. time', value: durationfmt(totalTime / totalDays) },
      { label: 'Started', value: moment(firstPunch.in).format('MMM Do, YYYY') },
      { label: 'Last active', value: moment(latestPunch.out || Date.now()).fromNow() },
      // { label: 'Shortest', value: durationfmt(shortestPunch.duration) + ' on ' + moment(shortestPunch.in).format('MMMM Do, YYYY') },
      // { label: 'Longest', value: durationfmt(longestPunch.duration) + ' on ' + moment(longestPunch.in).format('MMMM Do, YYYY') },
    ]
  };
};