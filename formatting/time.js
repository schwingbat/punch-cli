const moment = require('moment');

exports.date = time => moment(time).format('MMM Do YYYY');
exports.time = time => moment(time).format('h[:]mm A');
exports.dateTime = time => moment(time).format('MMM Do YYYY h[:]mm A');
