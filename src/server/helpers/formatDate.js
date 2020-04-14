const moment = require("moment-timezone");

module.exports = props =>
  function (value) {
    const { config } = props;

    return moment(value)
      .tz(config.display.timeZone)
      .format(config.display.dateFormat);
  };
