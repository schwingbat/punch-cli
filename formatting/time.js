const datefmt = require('dateformat');

const styles = {
  time: 'h:MMtt',
  dateTime: 'm/d/yy h:MMtt'
}

exports.time = function(epoch) {
  return datefmt(new Date(epoch), styles.time);
}

exports.dateTime = function(epoch) {
  return datefmt(new Date(epoch), styles.dateTime);
}