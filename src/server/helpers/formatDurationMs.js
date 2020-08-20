const config = require("../../config").current();
const formatDuration = require("../../format/duration");

module.exports = (props) =>
  function (ms, options) {
    return formatDuration(ms, {
      resolution: options.hash.resolution || "seconds",
      fractional: options.hash.short || false,
      style: config.display.durationStyle,
    });
  };
