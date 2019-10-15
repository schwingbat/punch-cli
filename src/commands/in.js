const parseDateTime = require("../utils/parse-datetime");

module.exports = ({ config, Punch }) => ({
  signature: "in <project>",
  description: "start tracking time on a project",
  examples: ["punch in punch-cli", "punch in tps-reports"],
  arguments: [
    {
      name: "project",
      description: "name of the project"
    }
  ],
  options: [
    {
      name: "time",
      short: "t",
      description: "time to set as punch in time (defaults to current time)",
      type: parseDateTime
    },
    {
      name: "dry-run",
      description: "run but don't commit punch",
      type: "boolean"
    }
  ],
  run: async function(args) {
    const { confirmAdjustedTime } = require("../punch/utils");
    const chalk = require("chalk");
    const getLabelFor = require("../utils/get-label-for");
    const getMessageFor = require("../utils/message-for");
    const handleSync = require("../utils/handle-sync");
    const Loader = require("../utils/loader");
    const updateCurrentMarker = require("../utils/update-current-marker");

    const loader = Loader();
    const dryRun = !!args.options["dry-run"];

    loader.start("Punching in...");

    await handleSync({ silent: true, config, Punch });

    const current = await Punch.current(args.project);

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
      if (config.projects[args.project]) {
        if (
          args.options.time &&
          !confirmAdjustedTime(config, args.options.time, "Punch in at $?")
        ) {
          loader.stop();
          return;
        }

        const punch = new Punch({
          project: args.project,
          in: args.options.time
        });

        if (!dryRun) {
          await punch.save();
        }

        updateCurrentMarker(config, punch);

        let msg = "";

        msg += chalk.green(config.symbols.success);
        msg += " Punched in on " + getLabelFor(config, args.project) + ".";
        msg += " " + getMessageFor("punched-in", { default: "" });

        loader.stop(msg);

        if (!dryRun) {
          await handleSync({ config, Punch });
        }
      } else {
        let msg = "";

        msg += "\n";
        msg += chalk.yellow(config.symbols.warning) + " ";
        msg +=
          chalk.bold(args.project) +
          " is not a project in your config file. You'll have to add it first.\n";
        msg +=
          "Enter " +
          chalk.bold("punch config") +
          " to edit your configuration.\n";

        loader.stop(msg);
      }
    }
  }
});
