const { confirm } = require("../punch/utils");
const chalk = require("chalk");
const formatDate = require("date-fns/format");
const parseDateTime = require("../utils/parse-datetime");

module.exports = ({ config, Punch }) => ({
  signature: "adjust <punchID>",
  description: "adjust punch start/end times",
  arguments: [{
    name: "punchID",
    description: "ID of a given punch (use \"punch log --with-ids\" to find IDs)",
    // parse: val => val
  }],
  options: [{
    name: "start",
    short: "s",
    description: "start date and time for punch",
    type: parseDateTime
  }, {
    name: "end",
    short: "e",
    description: "start date and time for punch",
    type: parseDateTime
  }],
  run: async function (args) {
    const punch = (await Punch.select(p => p.id === args.punchID))[0];

    if (punch) {
      if (!punch.out && args.options.end) {
        return console.log("You can't set and end for a running punch. Use "
                         + chalk.bold("punch out -t <value>")
                         + " to set a punch out time.");
      }

      if (args.options.start) punch.in = args.options.start;
      if (args.options.end) punch.out = args.options.end;

      if (punch.out < punch.in) {
        console.log("Punch can't end before it starts.");
        return;
      }

      // TODO: Show comparison/preview of changes with a real confirmation

      console.log({
        start: formatDate(punch.in, config.display.dateFormat + " " + config.display.timeFormat),
        end: formatDate(punch.out, config.display.dateFormat + " " + config.display.timeFormat)
      });

      if (confirm("?")) {
        await punch.save();
        console.log("Saved");
      }
    } else {
      console.log("Punch not found");
    }
  }
});