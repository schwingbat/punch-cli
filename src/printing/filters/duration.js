const fmtDuration = require("../../format/duration");

module.exports = env => {
  env.addFilter("duration", fmtDuration);
};
