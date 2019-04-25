module.exports = function(config, project) {
  // Turn the detailed object into an array of formatted stats.

  const distanceInWords = require("date-fns/distance_in_words");
  const formatDate = require("date-fns/format");
  const chalk = require("chalk");
  const formatCurrency = require("./currency");
  const formatDuration = require("./duration");

  const {
    fullName,
    description,
    totalTime,
    totalPay,
    hourlyRate,
    totalPunches,
    firstPunch,
    latestPunch
  } = project;

  let lastActive = latestPunch.out
    ? distanceInWords(latestPunch.out, new Date()) + " ago"
    : chalk.bold.green("Now");

  return {
    name: fullName,
    description: description || chalk.grey("No description"),
    pay: totalPay ? formatCurrency(totalPay) : null,
    time: formatDuration(totalTime),
    rate: hourlyRate ? formatCurrency(hourlyRate) + "/hr" : null,
    stats: [
      { label: "Punches", value: totalPunches },
      {
        label: "Started",
        value: formatDate(firstPunch.in, config.display.dateFormat)
      },
      { label: "Last active", value: lastActive }
    ]
  };
};
