const chrono = require("chrono-node");

module.exports = function (str) {
  const [date, time] = str.split("@").map((s) => s.trim());
  return chrono.parseDate(`${date} at ${time}`);
};
