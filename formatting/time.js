const datefmt = require('dateformat');

const styles = {
  date: 'm/d/yyyy',
  time: 'h:MMtt',
  dateTime: 'm/d/yyyy h:MMtt',
}

exports.date = function(epoch) {
  return datefmt(new Date(epoch), styles.date);
}

exports.time = function(epoch) {
  return datefmt(new Date(epoch), styles.time);
}

exports.dateTime = function(epoch) {
  return datefmt(new Date(epoch), styles.dateTime);
}