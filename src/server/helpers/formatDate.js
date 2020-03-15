const { format } = require("date-fns-tz");

module.exports = props =>
  function(value) {
    const { config } = props;

    const date = new Date(value);

    return format(date, config.display.dateFormat, {
      timeZone: config.display.timeZone
    });
  };
