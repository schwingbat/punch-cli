const fuzzyParse = require("../utils/fuzzy-parse");
const Log = require("../logging/log");

module.exports = ({ config, Punch }) => ({
  signature: "log [when...]",
  description:
    "show a summary of punches for a given period ('last month', 'this week', 'two days ago', etc)",
  examples: [
    "punch log today",
    "punch log last tuesday",
    "punch log this month",
    "punch log -s 2018-11-25 -e 2018-12-25 -p punch"
  ],
  arguments: [
    {
      name: "when",
      description: "time period to log",
      default: "today",
      parse: words => words.join(" ")
    }
  ],
  options: [
    {
      name: "start",
      short: "s",
      type: "string",
      description: "log punches between specific dates (use with --end)"
    },
    {
      name: "end",
      short: "e",
      type: "string",
      description: "log punches between specific dates (use with --start)"
    },
    {
      name: "project",
      short: "p",
      type: "string",
      description: "show only punches for a given project"
    },
    {
      name: "object",
      short: "o",
      type: "string",
      description:
        "show only punches tagged with a given comment object (e.g. @task:1669)"
    },
    {
      name: "tag",
      short: "t",
      type: "string",
      description: "show only punches with a specific #tag"
    },
    {
      name: "with-ids",
      type: "boolean",
      description: "print punch IDs"
    },
    {
      name: "with-graphics",
      type: "boolean",
      description: "override app config and show hourly punch graphics"
    }
  ],
  run: function(args) {
    let interval;

    let start = args.options["start"];
    let end = args.options["end"];

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

    if (args.options["with-ids"]) {
      config.display.showPunchIDs = true;
      config.display.showCommentIndices = true;
    }

    if (args.options["with-graphics"]) {
      config.display.showDayGraphics = true;
    }

    if (interval) {
      Log(config, Punch).forInterval(interval, args.options);
    }
  }
});
