const { descendingBy } = require("../utils/sort-factories");

/**
 * Summarize punch stats per project.
 *
 * @param {*} config
 * @param {*} punches
 * @param {*} interval
 */
module.exports = function summarize(config, punches, interval) {
  const projects = {};

  for (let i = 0; i < punches.length; i++) {
    const punch = punches[i];
    const name = punch.project;
    const project = config.projects[name];

    if (!projects[name]) {
      projects[name] = {
        name: project ? project.name : name,
        pay: 0,
        time: 0,
        punches: [],
      };
    }

    projects[name].pay += punch.payWithinInterval(interval);
    projects[name].time += punch.durationWithinInterval(interval);
    projects[name].punches.push(punch);
  }

  const projectArray = [];

  for (const alias in projects) {
    projectArray.push({
      alias,
      isPaid: !!(config.projects[alias] && config.projects[alias].hourlyRate),
      ...projects[alias],
    });
  }

  return projectArray.sort(descendingBy("time"));
};
