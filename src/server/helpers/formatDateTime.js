const moment = require("moment-timezone");

module.exports = (props) =>
  function (value) {
    const { config } = props;
    const { timeZone, dateTimeFormat } = config.display;

    return moment(value).tz(timeZone).format(dateTimeFormat);
  };
