const formatDuration = require("../../format/duration");

module.exports = () =>
  function(one, two, options) {
    one = new Date(one || new Date()).getTime();
    two = new Date(two || new Date()).getTime();

    let diff = two - one;
    let isNegative = diff < 0;

    let formatted = formatDuration(Math.abs(diff), {
      resolution: options.hash.resolution || "minutes",
      fractional: options.hash.short || false
    });

    if (isNegative) {
      formatted = "-" + formatted;
    } else {
      formatted = "+" + formatted;
    }

    return formatted;
  };
