const { allPunchedIn, confirm, confirmAdjustedTime } = require("../punch/utils");
const chalk = require("chalk");
const formatCurrency = require("../format/currency");
const formatDate = require("date-fns/format");
const formatDuration = require("../format/duration");
const getLabelFor = require("../utils/get-label-for");
const handleSync = require("../utils/handle-sync");
const Loader = require("../utils/loader");
const parseDateTime = require("../utils/parse-datetime");
const updateCurrentMarker = require("../utils/update-current-marker");

module.exports = ({ config, Punch }) => ({
  signature: "out [project]",
  description: "stop tracking time",
  arguments: [{
    name: "project",
    description: "name of the project"
  }],
  options: [{
    name: "comment",
    short: "c",
    description: "add a description of what you worked on",
    type: "string"
  }, {
    name: "time",
    short: "t",
    description: "time to set as punch out time (defaults to current time)",
    type: parseDateTime
  }, {
    name: "no-comment",
    description: "punch out without warning about a lack of comments",
    type: "boolean"
  }, {
    name: "dry-run",
    description: "run but don't commit punch out",
    type: "boolean"
  }],
  run: async function (args) {
    const loader = Loader();
    const dryRun = args.options["dry-run"];

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
      if (args.options.time) {
        if (args.options.time < current.in) {
          loader.stop("You can't punch out before you punched in.");
          return;
        }

        if (!confirmAdjustedTime(config, args.options.time, "Punch out at $?")) {
          loader.stop();
          return;
        }
      }

      if (current.comments.length === 0 && !args.options.comment) {
        let noComment;

        if (args.options["no-comment"]) {
          noComment = true;
        } else {
          noComment = confirm("Are you sure you want to punch out with no comment?");
        }

        if (!noComment) {
          loader.stop("Use the --comment or -c flags to add a comment:\n  usage: punch out -c \"This is a comment.\"\n");
          return;
        }
      }

      if (!dryRun) {
        await current.punchOut(args.options.comment, {
          autosave: true,
          time: args.options.time || new Date()
        });
      }

      const label = getLabelFor(config, current.project);
      const duration = formatDuration(current.duration(args.options.time));
      const time = formatDate(args.options.time || new Date(), config.display.timeFormat);
      const pay = current.pay(args.options.time);

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
      loader.stop(`${chalk.yellow(config.symbols.warning)} You're not punched in!`);
    }
  }
});