const parseDateTime = require("../utils/parse-datetime");
const { confirm } = require("../punch/utils");
const chalk = require("chalk");
const formatDate = require("date-fns/format");

const { Command } = require("@ratwizard/cli");

module.exports = new Command()
  .usage("adjust [--options] <id>")
  .description("adjust punch start/end times")
  .arg("id", {
    description: "ID of a given punch (use 'punch log --with-ids' to find IDs)"
  })
  .option("start", "s", {
    description: "start date and time for punch",
    parse: parseDateTime
  })
  .option("end", "e", {
    description: "end date and time for punch",
    parse: parseDateTime
  })
  .action(async ({ args, options, props }) => {
    const { config, Punch } = props;

    const punch = await Punch.find(p => p.id === args.id);

    if (punch) {
      if (!punch.out && options.end) {
        return console.log(
          "You can't set an end for a running punch. Use " +
            chalk.bold("punch out -t <value>") +
            " to set a punch out time."
        );
      }

      let punchIn = options.start || punch.in;
      let punchOut = options.end || punch.out;

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
      if (options.start != null) {
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
      if (options.end != null) {
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
        if (options.start) {
          punch.in = options.start;
        }
        if (options.end) {
          punch.out = options.end;
        }

        // Update 'updated' timestamp.
        punch.update();

        await punch.save();
        console.log("Saved");
      }
    } else {
      console.log("Punch not found");
    }
  });
