const formatDuration = require("../../format/duration");

module.exports = props =>
  function(start, end) {
    start = new Date(start);
    end = new Date(end);

    const diff = end.getTime() - start.getTime();

    return formatDuration(diff, {
      resolution: "minutes"
    });
  };
