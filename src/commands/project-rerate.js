const parseDateTime = require("../utils/parse-datetime");
const { confirm } = require("../punch/utils");

const { Command } = require("@ratwizard/cli");

module.exports = new Command("project-rerate")
  .description(
    "update hourly rate for all of a project's punches within a given time span"
  )
  .examples(["punch adjust-rate punch 50 --start 2018-08-01 --end 2018-09-01"])
  .arg("project", {
    description: "project alias"
  })
  .arg("new-rate", {
    key: "newRate",
    description: "new rate",
    type: "number"
  })
  .option("start", "s", {
    description: "starting date and time",
    parse: parseDateTime
  })
  .option("end", "e", {
    description: "ending date and time",
    parse: parseDateTime
  })
  .action(async ({ args, options, props }) => {
    const { Punch } = props;

    const { project, newRate } = args;
    const { start, end } = options;

    const punches = await Punch.filter(
      p =>
        p.project === project &&
        (!start || p.in >= start) &&
        (!end || p.in <= end)
    );

    if (confirm(`Change rate to ${newRate} on ${punches.length} punches?`)) {
      for (let punch of punches) {
        punch.rate = newRate;
        punch.update();
        await punch.save();
      }

      console.log("Updated punches");
    }
  });
