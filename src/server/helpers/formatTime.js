const format = require("date-fns/format");

module.exports = props =>
  function(value) {
    const { config } = props;

    const date = new Date(value || null);

    return format(date, config.display.timeFormat);
  };
