const { ascendingBy } = require("../utils/sort-factories");
const { projectSummary } = require("../logging/printing");
const formatSummary = require("../format/project-summary");
const getLabelFor = require("../utils/get-label-for");
const padWithLines = require("../logging/pad-with-lines");

module.exports = ({ config, Punch }) => ({
  signature: "projects [names...]",
  description: "show statistics for all projects in your config file",
  run: async function (args) {
    let names = args.names || Object.keys(config.projects);

    let allPunches = await Punch.all();
    allPunches = allPunches.sort(ascendingBy("in"));
    const summaries = [];

    for (let i = 0; i < names.length; i++) {
      const project = names[i];
      const punches = allPunches.filter(p => p.project === project);

      if (punches.length > 0) {
        let firstPunch = punches[0];
        let latestPunch = punches[punches.length - 1];

        const projectData = config.projects[project];
        const fullName = getLabelFor(config, project);
        const totalTime = punches.reduce((sum, punch) => sum + punch.duration(), 0);
        const totalPay = punches.reduce((sum, punch) => sum + punch.pay(), 0);
        const hourlyRate = projectData && projectData.hourlyRate
          ? projectData.hourlyRate
          : 0;

        summaries.push({
          fullName,
          description: projectData.description,
          totalTime,
          totalPay,
          hourlyRate,
          firstPunch,
          latestPunch,
          totalPunches: punches.length
        });
      }
    }

    let str = "";

    summaries
      .sort(ascendingBy("fullName"))
      .forEach(s => {
        str += projectSummary(formatSummary(config, s)) + "\n\n";
      });

    console.log(padWithLines(str, 1));
  }
});