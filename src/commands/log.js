const fuzzyParse = require("../utils/fuzzy-parse");
const parseDateTime = require("../utils/parse-datetime");
const Log = require("../logging/log");
const moment = require("moment-timezone");
const { Command } = require("@ratwizard/cli");

module.exports = new Command()
  .usage("{*} [--options] [when...]")
  .description("show a summary of punches for a given period")
  .examples([
    "{*} today",
    "{*} last tuesday",
    "{*} this month",
    "{*} this week",
    "{*} -s 2018-11-25 -e 2018-12-25 -p punch",
  ])
  .arg("when", {
    description: "time period to log",
    default: "today",
    splat: true,
    parse: (value) => value.join(" "),
  })
  .option("-s, --start <timestamp>", {
    description: "log punches between specific dates (use with --end)",
  })
  .option("-e, --end <timestamp>", {
    description: "log punches between specific dates (use with --start)",
  })
  .option("-p, --project <alias>", {
    description: "show only punches for a given project",
  })
  .option("-o, --object <name>", {
    description:
      "show only punches tagged with a given comment object (e.g. @task:1669)",
  })
  .option("-t, --tag <name>", {
    description: "show only punches with a specific #tag",
  })
  .option("-i, --with-ids", {
    description: "print punch IDs",
    boolean: true,
  })
  .option("--with-graphics", {
    description: "override app config and show hourly punch graphics",
    boolean: true,
  })
  .action(async function ({ args, options, props }) {
    const { config, Punch } = props;

    if ((options.start && !options.end) || (!options.start && options.end)) {
      console.log(`--start and --end options must be used together.`);
      return;
    }

    let interval;

    if (options.start || options.end) {
      const start = moment(
        options.start ? parseDateTime(options.start) : new Date()
      ).startOf("day");

      const end = moment(
        options.end ? parseDateTime(options.end) : new Date()
      ).endOf("day");

      interval = {
        unit: "day",
        modifier: 0,
        start: start.toDate(),
        end: end.toDate(),
      };

      const hours = end.diff(start, "hours");
      const days = hours / 24;
      const weeks = days / 7;
      const months = weeks / 4;

      if (~~months > 0) {
        interval.unit = "month";
        interval.modifier *= ~~months;
      } else if (~~days > 0) {
        interval.unit = "week";
        interval.modifier *= ~~weeks;
      } else {
        interval.unit = "day";
        interval.modifier *= ~~days;
      }
    } else {
      interval = fuzzyParse(args.when);
    }

    if (options["with-ids"]) {
      config.display.showPunchIDs = true;
      config.display.showCommentIndices = true;
    }

    if (options["with-graphics"]) {
      config.display.showDayGraphics = true;
    }

    if (interval) {
      await Log(config, Punch).forInterval(interval, options);
    }
  });
