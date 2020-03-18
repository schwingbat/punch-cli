const moment = require("moment-timezone");

/**
 * Formats a date object as a time.
 *
 * @param {Date} value - A JS Date object.
 */
module.exports = (env, config) => {
  const { timeZone, timeFormat, dateFormat } = config.display;

  env.addFilter("datetime", value =>
    moment(value)
      .tz(timeZone)
      .format(timeFormat + "@" + dateFormat)
  );

  env.addFilter("date", value =>
    moment(value)
      .tz(timeZone)
      .format(dateFormat)
  );

  env.addFilter("time", value =>
    moment(value)
      .tz(timeZone)
      .format(timeFormat)
  );
};
