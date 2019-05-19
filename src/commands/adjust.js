const { confirm } = require("../punch/utils");
const chalk = require("chalk");
const formatDate = require("date-fns/format");
const parseDateTime = require("../utils/parse-datetime");

module.exports = ({ config, Punch }) => ({
  signature: "adjust <punchID>",
  description: "adjust punch start/end times",
  arguments: [
    {
      name: "punchID",
      description:
        "ID of a given punch (use 'punch log --with-ids' to find IDs)"
      // parse: val => val
    }
  ],
  options: [
    {
      name: "start",
      short: "s",
      description: "start date and time for punch",
      type: parseDateTime
    },
    {
      name: "end",
      short: "e",
      description: "start date and time for punch",
      type: parseDateTime
    }
  ],
  run: async function(args) {
    const punch = (await Punch.select(p => p.id === args.punchID))[0];

    if (punch) {
      if (!punch.out && args.options.end) {
        return console.log(
          "You can't set an end for a running punch. Use " +
            chalk.bold("punch out -t <value>") +
            " to set a punch out time."
        );
      }

      let punchIn = args.options.start || punch.in;
      let punchOut = args.options.end || punch.out;

      if (punchOut != null && punchOut < punchIn) {
        console.log("Punch can't end before it starts.");
        return;
      }

      // TODO: Show comparison/preview of changes with a real confirmation

      const width = 40;

      const { dateFormat, timeFormat } = config.display;
      const dateTimeFormat = `${dateFormat} ${timeFormat}`;

      let str = "";

      let inBefore = formatDate(punch.in, dateTimeFormat);
      let outBefore = punch.out
        ? formatDate(punch.out, dateTimeFormat)
        : "RUNNING";
      let inAfter = formatDate(punchIn, dateTimeFormat);
      let outAfter = punchOut
        ? formatDate(punchOut, dateTimeFormat)
        : "RUNNING";

      str += "\n";

      str += "Punch In\n";
      if (args.options.start != null) {
        // Show change before if it's earlier and after if it's later.
        if (punchIn < punch.in) {
          str += chalk.green(`+ ${inAfter}`) + "\n";
          str += chalk.red(`- ${inBefore}`) + "\n";
        } else {
          str += chalk.red(`- ${inBefore}`) + "\n";
          str += chalk.green(`+ ${inAfter}`) + "\n";
        }
      } else {
        str += `  ${inBefore}`;
      }

      str += "Punch Out\n";
      if (args.options.end != null) {
        if (punchOut < punch.out) {
          str += chalk.green(`+ ${outAfter}`) + "\n";
          str += chalk.red(`- ${outBefore}`) + "\n";
        } else {
          str += chalk.red(`- ${outBefore}`) + "\n";
          str += chalk.green(`+ ${outAfter}`) + "\n";
        }
      } else {
        str += `  ${outBefore}`;
      }

      str += "\n";

      console.log(str);

      if (confirm("Adjust times?")) {
        if (args.options.start) {
          punch.in = args.options.start;
        }
        if (args.options.end) {
          punch.out = args.options.end;
        }

        // Update 'updated' timestamp.
        punch.update();

        await punch.save();
        console.log("Saved");
      }
    } else {
      console.log("Punch not found");
    }
  }
});
