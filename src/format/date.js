const format = require("date-fns/format");
const config = require("../config").current();

exports.formatDate = date => format(date, config.display.dateFormat || "PPPP");

exports.formatDateTime = date => {
  const { dateFormat, timeFormat } = config.display;
  return format(date, dateFormat + " '@' " + timeFormat);
};
