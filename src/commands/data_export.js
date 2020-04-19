const chalk = require("chalk");
const fs = require("fs");
const path = require("path");
const resolvePath = require("../utils/resolve-path");
const parseDateTime = require("../utils/parse-datetime");

const { Command } = require("@ratwizard/cli");

module.exports = new Command()
  .description("export punch data")
  .option("-s, --start <timestamp>", {
    description: "start date for punch selection",
    parse: parseDateTime,
  })
  .option("-e, --end <timestamp>", {
    description: "end date for punch selection",
    type: parseDateTime,
  })
  .option("-p, --project <alias>", {
    description: "project name for punch selection",
  })
  .option("-t, --tag <name>", {
    description: "comment tag values for punch selection",
  })
  .option("-f, --format <name>", {
    description: "formatting function file name (looks in ~/.punch/formatters)",
  })
  .option("-o, --output <path>", {
    description: "file path to save to (prints to console by default)",
  })
  .action(async ({ options, props }) => {
    const { config, Punch } = props;
    const { start, end, project, tag, format, output } = options;

    let formatter;
    let formatterPath = path.join(
      config.punchPath,
      "formatters",
      "export",
      format + ".js"
    );
    try {
      formatter = require(formatterPath);
    } catch (err) {
      console.log(chalk.red(`\nNo formatter for '${format}'`));
      console.log(`You can create ${chalk.green(formatterPath)} to define it.`);
      console.log(
        "Formatters should be a single exported function that takes an array of punch objects and returns a string.\n"
      );
      console.log("Here's a good starting point:");
      console.log(
        [
          "module.exports = function (punches) {",
          "  let str = ''",
          " ",
          "  // Do your thing!",
          " ",
          "  return str",
          "}",
        ].join("\n")
      );
      return;
    }

    const punches = await Punch.filter((p) => {
      if (start && p.in < start) {
        return false;
      }
      if (end && p.in > end) {
        return false;
      }
      if (project && p.project !== project) {
        return false;
      }
      if (tag && !p.hasCommentObject(tag)) {
        return false;
      }
      return true;
    });

    const formatted = formatter(config, punches);

    if (output) {
      fs.writeFileSync(resolvePath(output), formatted);
      console.log("Exported punches were saved to " + output);
    } else {
      console.log(formatted);
    }
  });
