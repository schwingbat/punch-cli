const chalk = require("chalk");
const getLabelFor = require("../utils/get-label-for");
const getMessageFor = require("../utils/message-for");
const handleSync = require("../utils/handle-sync");
const Loader = require("../utils/loader");
const parseDateTime = require("../utils/parse-datetime");
const updateCurrentMarker = require("../utils/update-current-marker");
const { confirmAdjustedTime } = require("../punch/utils");

const { Command } = require("@ratwizard/cli");

module.exports = new Command()
  .usage("in [--options] <project>")
  .description("start tracking time on a project")
  .examples([
    "punch in my-project",
    "punch in -t 9:15am my-project",
    "punch in my-project --start=2019-05-14@12:41pm"
  ])
  .arg("project", {
    description: "name of the project"
  })
  .option("time", "t", {
    description: "time to set as punch in time (defaults to current time)",
    parse: parseDateTime
  })
  .option("start", "s", {
    description: "time to set as punch in time (same as --time / -t)",
    parse: parseDateTime
  })
  .action(async ({ args, options, props }) => {
    const { config, Punch } = props;

    const loader = Loader();
    const time = options.time || options.start;
    const { project } = args;

    loader.start("Punching in...");

    await handleSync({ silent: true, config, Punch });

    const current = (await Punch.current(project))[0];

    if (current) {
      loader.stop(
        chalk.red(config.symbols.error) +
          ` You're already punched in on ${getLabelFor(
            config,
            current.project
          )}! Punch out first.`
      );
    } else {
      // Check if project is in config file
      if (config.projects[project]) {
        if (time && !confirmAdjustedTime(config, time, "Punch in at $?")) {
          loader.stop();
          return;
        }

        const punch = new Punch({
          project: project,
          in: time || new Date()
        });

        await punch.save();

        updateCurrentMarker(config, punch);

        let msg = "";

        msg += chalk.green(config.symbols.success);
        msg += " Punched in on " + getLabelFor(config, project) + ".";
        msg += " " + getMessageFor("punched-in", { default: "" });

        loader.stop(msg);

        await handleSync({ config, Punch });
      } else {
        let msg = "";

        msg += "\n";
        msg += chalk.yellow(config.symbols.warning) + " ";
        msg +=
          chalk.bold(project) +
          " is not a project in your config file. You'll have to add it first.\n";
        msg +=
          "Enter " +
          chalk.bold("punch config") +
          " to edit your configuration.\n";

        loader.stop(msg);
      }
    }
  });
