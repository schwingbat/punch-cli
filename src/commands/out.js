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

module.exports = command =>
  command
    .description("stop tracking time")
    .examples(["punch out", "punch out my-project"])
    .arg("project", {
      description:
        "name of the project (required if punched in on multiple projects)",
      optional: true
    })
    .flag("comment", "c", {
      description: "add a description of what you worked on"
    })
    .flag("time", "t", {
      description: "time to set as punch out time (defaults to current time)",
      parse: parseDateTime
    })
    .flag("no-comment", {
      description: "punch out without warning about a lack of comments",
      boolean: true
    })
    .run(async ({ args, flags, props }) => {
      const { config, Punch } = props;

      const loader = Loader();
      const dryRun = flags["dry-run"];

      loader.start("Punching out...");

      await handleSync({ silent: true, config, Punch });

      let current;

      if (args.project) {
        current = await Punch.current(args.project);
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
          current = await Punch.current(punchedIn[0]);
        }
      }

      if (current) {
        if (flags.time) {
          if (flags.time < current.in) {
            loader.stop("You can't punch out before you punched in.");
            return;
          }

          if (!confirmAdjustedTime(config, flags.time, "Punch out at $?")) {
            loader.stop();
            return;
          }
        }

        if (current.comments.length === 0 && !flags.comment) {
          let noComment;

          if (flags["no-comment"]) {
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
          await current.punchOut(flags.comment, {
            autosave: true,
            time: flags.time || new Date()
          });
        }

        const label = getLabelFor(config, current.project);
        const duration = formatDuration(current.duration(flags.time));
        const time = moment(flags.time).format(config.display.timeFormat);
        const pay = current.pay(flags.time);

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
    });
