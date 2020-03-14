const parseDateTime = require("../utils/parse-datetime");
const { confirm } = require("../punch/utils");
const formatCurrency = require("../format/currency");
const formatDate = require("date-fns/format");
const formatDuration = require("../format/duration");
const handleSync = require("../utils/handle-sync");

module.exports = command =>
  command
    .description("create a punch")
    .arg("project", {
      description: "name of the project"
    })
    .flag("start", "s", {
      description: "start time and date (e.g. MM/DD/yyyy@12:00PM)",
      parse: parseDateTime
    })
    .flag("end", "e", {
      description: "end time and date",
      parse: parseDateTime
    })
    .flag("comment", "c", {
      description: "a description of what you worked on"
    })
    .run(async ({ args, flags, props }) => {
      const { config, Punch } = props;
      const project = config.projects[args.project];

      if (!project) {
        return console.log("Project does not exist in your config file");
      }

      const timeIn = flags.start;
      const timeOut = flags.end;
      const comment = flags.comment;

      const duration = timeOut.getTime() - (timeIn || new Date()).getTime();
      let pay;
      if (project.hourlyRate) {
        pay = formatCurrency((duration / 3600000) * project.hourlyRate);
      } else {
        pay = "N/A";
      }

      if (timeOut < timeIn) {
        console.log("Punch can't end before it starts.");
        return;
      }

      let str = "\n";
      str += `   Project: ${project.name} (${project.alias})\n`;
      str += `   Time In: ${formatDate(timeIn, "PPPP '@' p")}\n`;
      str += `  Time Out: ${formatDate(timeOut, "PPPP '@' p")}\n`;
      str += `  Duration: ${formatDuration(duration)}\n`;
      str += `       Pay: ${pay}\n`;

      if (comment) {
        str += `   Comment: ${comment}\n\n`;
      }

      str += "Create this punch?";

      if (confirm(str)) {
        const punch = new Punch({
          project: project.alias,
          in: timeIn,
          out: timeOut,
          rate: project.hourlyRate || 0
        });

        if (comment) {
          punch.addComment(comment);
        }

        await punch.save();

        console.log("Punch created!");

        await handleSync({ config, Punch });
      }
    });
