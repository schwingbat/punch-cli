const parseDateTime = require("../utils/parse-datetime");

module.exports = () => ({
  signature: "timestamp [time]",
  description:
    "get a millisecond timestamp for a given time (mm/dd/yyyy@hh:mm:ss)",
  examples: ["punch timestamp 6/5/2018@10:31am", "punch timestamp"],
  arguments: [
    {
      name: "time",
      description: "datetime string to get a timestamp for",
      parse: parseDateTime,
      default: () => new Date()
    }
  ],
  hidden: true,
  run: function(args) {
    const chalk = require("chalk");
    const formatDate = require("date-fns/format");

    const timestamp = args.time.getTime();

    console.log(
      timestamp +
        chalk.grey(" << ") +
        formatDate(args.time, "MMM Do yyyy, hh:mm:ssa")
    );
  }
});
