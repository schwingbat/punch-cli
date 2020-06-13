const isSameDay = require("date-fns/isSameDay");
const addDays = require("date-fns/addDays");

const summarize = require("./summarize");

module.exports = function Logger(config, Punch) {
  const messageFor = require("../utils/message-for");
  const printDay = require("./log-day");
  const printYear = require("./log-year");
  const printPeriod = require("./log-period");
  const heatmap = require("../utils/heatmap");

  return {
    async forInterval(interval, args = {}) {
      let { project, object, tag } = args;

      const now = Date.now();
      let punches;

      if (interval.unit === "week") {
        interval.start = addDays(interval.start, 1);
        interval.end = addDays(interval.end, 1);
      }

      if (interval.start > new Date()) {
        return console.log(messageFor("future-punch-log"));
      }

      punches = await Punch.select((p) => {
        // Reject if start date is out of the interval's range
        if (!((p.out || now) >= interval.start && p.in <= interval.end)) {
          return false;
        }
        if (project && p.project !== project) {
          return false;
        }
        if (object && !p.hasCommentWithObject(object)) {
          return false;
        }
        if (tag && !p.hasCommentWithTag(tag)) {
          return false;
        }
        return true;
      });

      if (punches.length === 0) {
        // Figure out what to say if there are no results
        if (Object.keys(args).length > 0) {
          return console.log(messageFor("no-sessions-with-criteria"));
        } else {
          if (isSameDay(interval.start, new Date())) {
            return console.log(messageFor("no-sessions-today"));
          } else if (isSameDay(interval.start, addDays(new Date(), -1))) {
            return console.log(messageFor("no-sessions-yesterday"));
          } else {
            return console.log(messageFor("no-sessions"));
          }
        }
      }

      const logData = {
        config,
        punches,
        date: interval.start,
        project,
        summary: summarize(config, punches, interval),
        interval,
      };

      switch (interval.unit) {
        case "year":
          // Shows a higher level summary
          printYear(logData, summarize);
          break;
        case "month":
          printPeriod(logData);
          // TODO: Print month heatmap.
          // const hmap = heatmap.month(interval.start, punches, config)
          // console.log(hmap + '\n')
          break;
        case "week":
          const { longestProjectName } = printPeriod(logData);
          const hmap = heatmap.week(punches, config, {
            labelPadding: longestProjectName + 3,
          });
          console.log(hmap + "\n");
          break;
        case "day":
          await printDay(logData);
          break;
        default:
          // Catchall for custom intervals
          printPeriod(logData);
          break;
      }
    },
    _summarize: summarize,
  };
};
