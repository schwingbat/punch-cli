const moment = require("moment-timezone");
const config = require("../config").current();

exports.formatDate = date => {
  console.log(date);

  const { dateFormat } = config.display;

  const fmt = moment(date).format(dateFormat);
  console.log(fmt);
  return fmt;
};

exports.formatDateTime = date => {
  const { dateFormat, timeFormat } = config.display;
  return moment(date).format(dateFormat + " '@' " + timeFormat);
};
