const moment = require("moment-timezone");

module.exports = (props) =>
  function (value, format) {
    const { config } = props;

    const dateFormat =
      typeof format === "string" ? format : config.display.dateFormat;

    return moment(value).tz(config.display.timeZone).format(dateFormat);
  };
