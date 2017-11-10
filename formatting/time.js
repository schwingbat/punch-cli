const moment = require('moment');

exports.date = time => moment(time).format('m/d/yyyy');
exports.time = time => moment(time).format('h:MMtt');
exports.dateTime = time => moment(time).format('m/d/yyyy h:MMtt');