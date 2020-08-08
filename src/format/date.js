const moment = require("moment-timezone");
const config = require("../config").current();

exports.formatDate = (date) => {
  const { dateFormat } = config.display;

  const fmt = moment(date).format(dateFormat);
  return fmt;
};

exports.formatDateTime = (date) => {
  const { dateFormat, timeFormat } = config.display;
  return moment(date).format(dateFormat + ", " + timeFormat);
};
