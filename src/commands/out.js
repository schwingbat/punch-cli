const {
  allPunchedIn,
  confirm,
  confirmAdjustedTime
} = require("../punch/utils");
const parseDateTime = require("../utils/parse-datetime");
const chalk = require("chalk");
const moment = require("moment-timezone");
const formatCurrency = require("../format/currency");
const formatDuration = require("../format/duration");
const getLabelFor = require("../utils/get-label-for");
const handleSync = require("../utils/handle-sync");
const Loader = require("../utils/loader");
const updateCurrentMarker = require("../utils/update-current-marker");

const { Command } = require("@ratwizard/cli");

module.exports = new Command({
  usage: "out [--options] [project]",
  description: "stop tracking time",
  examples: [
    "punch out",
    "punch out my-project",
    "punch out --time 7:30PM --comment 'did some work'",
    "punch out -t 2020-03-15@5:15AM"
  ],
  args: [
    {
      name: "project",
      description:
        "name of the project (required if punched in on multiple projects)",
      optional: true
    }
  ],
  options: {
    "-c, --comment <text>": {
      description: "add a description of what you worked on"
    },
    "-t, --time <datetime>": {
      description: "time to set as punch out time (defaults to now)",
      parse: parseDateTime
    },
    "--no-comment": {
      key: "noComment",
      description: "punch out without warning about a lack of comments",
      boolean: true
    }
  },
  action: async function({ args, options, props }) {
    const { config, Punch } = props;

    const loader = Loader();
    const dryRun = options["dry-run"];

    loader.start("Punching out...");

    await handleSync({ silent: true, config, Punch });

    let current;

    if (args.project) {
      current = (await Punch.current(args.project))[0];
    } else {
      const punchedIn = await allPunchedIn({ config, Punch });

      if (punchedIn.length >= 2) {
        let str = `\nYou are punched in on ${punchedIn.length} projects:\n  `;
        str += punchedIn.join("\n  ");
        str += "\n\n";
        str += "Specify which one you want to punch out of:\n  ";
        str += punchedIn.map(s => `punch out ${s}`).join("\n  ");
        str += "\n";
        loader.stop(str);
        return;
      } else if (punchedIn.length == 1) {
        current = (await Punch.current(punchedIn[0]))[0];
      }
    }

    if (current) {
      if (options.time) {
        if (options.time < current.in) {
          loader.stop("You can't punch out before you punched in.");
          return;
        }

        if (!confirmAdjustedTime(config, options.time, "Punch out at $?")) {
          loader.stop();
          return;
        }
      }

      if (current.comments.length === 0 && !options.comment) {
        let noComment;

        if (options.noComment) {
          noComment = true;
        } else {
          noComment = confirm(
            "Are you sure you want to punch out with no comment?"
          );
        }

        if (!noComment) {
          loader.stop(
            'Use the --comment or -c flags to add a comment:\n  usage: punch out -c "This is a comment."\n'
          );
          return;
        }
      }

      if (!dryRun) {
        await current.punchOut(options.comment, {
          autosave: true,
          time: options.time || new Date()
        });
      }

      const label = getLabelFor(config, current.project);
      const duration = formatDuration(current.duration(options.time));
      const time = moment(options.time).format(config.display.timeFormat);
      const pay = current.pay(options.time);

      let str = `Punched out on ${label} at ${time}. Worked for ${duration}`;
      if (pay > 0) {
        str += ` and earned ${formatCurrency(pay)}`;
      }
      loader.stop(chalk.green(config.symbols.success) + " " + str + ".");

      updateCurrentMarker(config, null);
      if (!dryRun) {
        await handleSync({ config, Punch });
      }
    } else {
      loader.stop(
        `${chalk.yellow(config.symbols.warning)} You're not punched in!`
      );
    }
  }
});
