const parseDateTime = require("../utils/parse-datetime");
const { confirm } = require("../punch/utils");
const { formatDateTime } = require("../format/date");
const chalk = require("chalk");

const { Command } = require("@ratwizard/cli");

module.exports = new Command()
  .usage("{*} [--options] <id>")
  .description("adjust punch start/end times")
  .arg("id", {
    description: "ID of a given punch (use 'punch log --with-ids' to find IDs)",
  })
  .option("-s, --start <datetime>", {
    description: "start date and time for punch",
    parse: parseDateTime,
  })
  .option("-e, --end <datetime>", {
    description: "end date and time for punch",
    parse: parseDateTime,
  })
  .action(async ({ args, options, props }) => {
    const { print, Punch } = props;

    const punch = await Punch.find((p) => p.id === args.id);

    if (punch) {
      if (!punch.out && options.end) {
        return print(
          "You can't set an end for a running punch. Use " +
            chalk.bold("punch out -t <value>") +
            " to set a punch out time."
        );
      }

      let punchIn = options.start || punch.in;
      let punchOut = options.end || punch.out;

      if (punchOut != null && punchOut < punchIn) {
        print("Punch can't end before it starts.");
        return;
      }

      // TODO: Show comparison/preview of changes with a real confirmation

      const buf = print.buffer();

      let inBefore = formatDateTime(punch.in);
      let outBefore = punch.out ? formatDateTime(punch.out) : "RUNNING";
      let inAfter = formatDateTime(punchIn);
      let outAfter = punchOut ? formatDateTime(punchOut) : "RUNNING";

      buf.newline().push("Punch In").newline();

      if (options.start != null) {
        // Show change before if it's earlier and after if it's later.
        if (punchIn < punch.in) {
          buf.push(chalk.green(`+ ${inAfter}`)).newline();
          buf.push(chalk.red(`- ${inBefore}`)).newline();
        } else {
          buf.push(chalk.red(`- ${inBefore}`)).newline();
          buf.push(chalk.green(`+ ${inAfter}`)).newline();
        }
      } else {
        buf.push(`  ${inBefore}`);
      }

      buf.push("Punch Out").newline();
      if (options.end != null) {
        if (punchOut < punch.out) {
          buf.push(chalk.green(`+ ${outAfter}`)).newline();
          buf.push(chalk.red(`- ${outBefore}`)).newline();
        } else {
          buf.push(chalk.red(`- ${outBefore}`)).newline();
          buf.push(chalk.green(`+ ${outAfter}`)).newline();
        }
      } else {
        buf.push(`  ${outBefore}`);
      }

      buf.newline();
      buf.push("Adjust times?");

      if (confirm(buf)) {
        if (options.start) {
          punch.in = options.start;
        }
        if (options.end) {
          punch.out = options.end;
        }

        // Update 'updated' timestamp.
        punch.update();

        await punch.save();
        print("Saved");
      }
    } else {
      print("Punch not found");
    }
  });
