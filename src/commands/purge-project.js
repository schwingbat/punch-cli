const { confirm } = require("../punch/utils");
const formatDuration = require("../format/duration");
const getLabelFor = require("../utils/get-label-for");

module.exports = ({ config, Punch }) => ({
  signature: "purge-project <project>",
  description: "destroy all punches for a given project",
  run: async function (args) {
    const { project } = args;
    const label = getLabelFor(config, project);
    const punches = await Punch.select(p => p.project === project);

    if (punches.length > 0) {

      const totalTime = punches.reduce((sum, p) => sum + p.duration(), 0);
      const duration = formatDuration(totalTime);

      // Confirm and commit changes to files.
      if (confirm(`Purging ${label} would delete ${punches.length} punches totalling ${duration}. Are you sure?`)) {
        for (const punch in punches) {
          await Punch.storage.delete(punch);
        }
        console.log(`Deleted ${punches.length} punches.`);
      }
    } else {
      console.log(`${label} has no punches.`);
    }
  }
});