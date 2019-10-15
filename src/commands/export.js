const parseDateTime = require("../utils/parse-datetime");

module.exports = ({ config, Punch }) => ({
  signature: "export",
  description: "exports punch data",
  hidden: true, // While work in progress
  examples: [],
  options: [
    {
      name: "start",
      short: "s",
      description: "start date for punch selection",
      type: parseDateTime
    },
    {
      name: "end",
      short: "e",
      description: "end date for punch selection",
      type: parseDateTime
    },
    {
      name: "project",
      short: "p",
      description: "project name for punch selection",
      type: "string"
    },
    {
      name: "tag",
      short: "t",
      description: "comment tag values for punch selection",
      type: "string"
    },
    {
      name: "format",
      short: "f",
      description:
        "formatting function file name (looks in ~/.punch/formatters)",
      type: "string"
    },
    {
      name: "output",
      short: "o",
      description: "file path to save to (prints to console by default)",
      type: "string"
    }
  ],
  run: async function(args) {
    const chalk = require("chalk");
    const fs = require("fs");
    const path = require("path");
    const resolvePath = require("../utils/resolve-path");

    const { start, end, project, tag, format, output } = args.options;

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
      console.log(`
module.exports = function (punches) {
  let str = ''

  // Do your thing!

  return str
}
`);
      return;
    }

    const punches = await Punch.select(p => {
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
  }
});
