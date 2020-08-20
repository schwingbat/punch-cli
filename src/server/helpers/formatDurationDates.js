const config = require("../../config").current();
const formatDuration = require("../../format/duration");

module.exports = (props) =>
  function (one, two, options) {
    one = new Date(one || new Date()).getTime();
    two = new Date(two || new Date()).getTime();

    const greater = Math.max(one, two);
    const lesser = Math.min(one, two);

    return formatDuration(greater - lesser, {
      resolution: options.hash.resolution || "seconds",
      fractional: options.hash.short || false,
      style: config.display.durationStyle,
    });
  };
