const chalk = require("chalk");
const path = require("path");
const fs = require("fs");
const formatDate = require("date-fns/format");
const { confirm } = require("../punch/utils");
const { simplePunches } = require("../logging/printing");

module.exports = command =>
  command
    .description("import punch data")
    .examples(["punch import ~/export.csv -f hourstracker"])
    .arg("file", {
      description: "path to a file of importable data"
    })
    .flag("format", "f", {
      description:
        "name of function to handle import (defined in ~/.punch/formatters/import)"
    })
    .run(async ({ args, flags, props }) => {
      const { config, Punch } = props;

      let contents;
      try {
        contents = fs.readFileSync(args.file, "utf8");
      } catch (err) {
        console.log("Error loading file: " + err.message);
      }

      if (!flags.format) {
        return console.log("Must pass --format with value");
      }

      const formatter = loadImporter(flags.format);
      if (formatter) {
        const punches = formatter(contents, Punch);

        const byDate = {};

        for (const punch of punches) {
          const key = formatDate(punch.in, config.display.dateFormat);
          if (!byDate[key]) byDate[key] = [];
          byDate[key].push(punch);
        }

        console.log();
        for (const date in byDate) {
          console.log(chalk.white.bold.underline(date) + "\n");
          console.log(simplePunches(byDate[date], config));
        }

        // TODO: Add overlap detection

        if (confirm("Import these punches?")) {
          for (const punch of punches) {
            await punch.save();
          }
          console.log(`${punches.length} punches imported.`);
        }
      }
    });

const loadImporter = (name, config) => {
  let formatter;
  let formatterPath = path.join(config.punchPath, "importers", name + ".js");
  try {
    formatter = require(formatterPath);
  } catch (err) {
    console.log(chalk.red(`\nNo formatter for '${name}'`));
    console.log(`You can create ${chalk.green(formatterPath)} to define it.`);
    console.log(
      "Formatters should be a single exported function that takes a file's contents as a string and returns an array of Punch objects.\n"
    );
    console.log("Here's a good starting point:");
    console.log(`
module.exports = function (fileContentsStr, Punch) {
  const punches = []

  // Do your thing!
  // punches.push(new Punch(...))

  return punches
}
`);
    return;
  }

  return formatter;
};
