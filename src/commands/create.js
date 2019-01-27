const { confirm } = require("../punch/utils");
const formatCurrency = require("../format/currency");
const formatDate = require("date-fns/format");
const formatDuration = require("../format/duration");
const handleSync = require("../utils/handle-sync");
const parseDateTime = require("../utils/parse-datetime");

module.exports = ({ config, Punch }) => ({
  signature: "create <project>",
  description: "create a punch",
  arguments: [{
    name: "project",
    description: "name of the project",
    parse: function (name) {
      const data = config.projects[name];
      if (data) {
        return data;
      } else {
        throw new Error("Project does not exist in your config file");
      }
    }
  }],
  options: [{
    name: "time-in",
    short: "i",
    description: "start time and date (e.g. MM/DD/YYYY@12:00PM)",
    type: parseDateTime
  }, {
    name: "time-out",
    short: "o",
    description: "end time and date",
    type: parseDateTime
  }, {
    name: "comment",
    short: "c",
    description: "a description of what you worked on",
    type: "string"
  }],
  run: async function (args) {
    const { project } = args;
    const timeIn = args.options["time-in"];
    const timeOut = args.options["time-out"];
    const comment = args.options["comment"];

    const duration = timeOut.getTime() - (timeIn || new Date()).getTime();
    let pay;
    if (project.hourlyRate) {
      pay = formatCurrency(duration / 3600000 * project.hourlyRate);
    } else {
      pay = "N/A";
    }

    if (timeOut < timeIn) {
      console.log("Punch can't end before it starts.");
      return;
    }

    let str = "\n";
    str += `   Project: ${project.name} (${project.alias})\n`;
    str += `   Time In: ${formatDate(timeIn, "dddd, MMM Do YYYY [@] h:mma")}\n`;
    str += `  Time Out: ${formatDate(timeOut, "dddd, MMM Do YYYY [@] h:mma")}\n`;
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
  }
});