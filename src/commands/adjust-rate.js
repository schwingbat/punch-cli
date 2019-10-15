const parseDateTime = require("../utils/parse-datetime");

module.exports = ({ Punch }) => ({
  signature: "adjust-rate <project> <newRate>",
  description: "adjust pay rate for punches",
  examples: ["punch adjust-rate punch 50 --start 2018-08-01 --end 2018-09-01"],
  arguments: [
    {
      name: "project",
      description: "project alias"
    },
    {
      name: "newRate",
      description: "new rate (number)",
      parse: Number
    }
  ],
  options: [
    {
      name: "start",
      description: "starting date",
      type: parseDateTime
    },
    {
      name: "end",
      description: "ending date",
      type: parseDateTime
    }
  ],
  run: async function(args) {
    const { confirm } = require("../punch/utils");

    const { project, newRate } = args;
    const { start, end } = args.options;

    const punches = await Punch.select(
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
  }
});
