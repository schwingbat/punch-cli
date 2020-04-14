const fuzzyParse = require("../utils/fuzzy-parse");
const Log = require("../logging/log");

const { Command } = require("@ratwizard/cli");

module.exports = new Command()
  .usage("log [--options] [when...]")
  .description("show a summary of punches for a given period")
  .examples([
    "punch log today",
    "punch log last tuesday",
    "punch log this month",
    "punch log this week",
    "punch log -s 2018-11-25 -e 2018-12-25 -p punch",
  ])
  .arg("when", {
    description: "time period to log",
    default: "today",
    splat: true,
    parse: (value) => value.join(" "),
  })
  .option("-s, --start <datetime>", {
    description: "log punches between specific dates (use with --end)",
  })
  .option("-e, --end <datetime>", {
    description: "log punches between specific dates (use with --start)",
  })
  .option("-p, --project <alias>", {
    description: "show only punches for a given project",
  })
  .option("-o, --object <object>", {
    description:
      "show only punches tagged with a given comment object (e.g. @task:1669)",
  })
  .option("-t, --tag <tag>", {
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
    let { start, end } = options;

    let interval;

    if ((start && !end) || (!start && end)) {
      console.log("--start and --end options must be used together");
      return;
    }

    if (start && end) {
      interval = {
        unit: "period",
        modifier: 0,
        start: fuzzyParse(start).start,
        end: fuzzyParse(end).end,
      };
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
