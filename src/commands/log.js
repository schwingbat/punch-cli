const fuzzyParse = require("../utils/fuzzy-parse");
const Log = require("../logging/log");

module.exports = command =>
  command
    .description(
      "show a summary of punches for a given period ('last month', 'this week', 'two days ago', etc)"
    )
    // TODO: Implement .example(str) and .example([str, str, ...])
    // .example([
    //   "punch log today",
    //   "punch log last tuesday",
    //   "punch log this month",
    //   "punch log -s 2018-11-25 -e 2018-12-25 -p punch"
    // ])
    .arg("when", {
      description: "time period to log",
      default: "today",
      splat: true,
      parse: value => value.join(" ")
    })
    .flag("start", "s", {
      description: "log punches between specific dates (use with --end)"
    })
    .flag("end", "e", {
      description: "log punches between specific dates (use with --start)"
    })
    .flag("project", "p", {
      description: "show only punches for a given project"
    })
    .flag("object", "o", {
      description:
        "show only punches tagged with a given comment object (e.g. @task:1669)"
    })
    .flag("tag", "t", {
      description: "show only punches with a specific #tag"
    })
    .flag("with-ids", {
      description: "print punch IDs",
      boolean: true
    })
    .flag("with-graphics", {
      description: "override app config and show hourly punch graphics",
      boolean: true
    })
    .action(async function(args, props) {
      const { config, Punch } = props;

      let interval;

      let start = args.flags["start"];
      let end = args.flags["end"];

      if ((start && !end) || (!start && end)) {
        console.log("--start and --end options must be used together");
        return;
      }

      if (start && end) {
        interval = {
          unit: "period",
          modifier: 0,
          start: fuzzyParse(start).start,
          end: fuzzyParse(end).end
        };
      } else {
        interval = fuzzyParse(args.when);
      }

      if (args.flags["with-ids"]) {
        config.display.showPunchIDs = true;
        config.display.showCommentIndices = true;
      }

      if (args.flags["with-graphics"]) {
        config.display.showDayGraphics = true;
      }

      if (interval) {
        Log(config, Punch).forInterval(interval, args.flags);
      }
    });
