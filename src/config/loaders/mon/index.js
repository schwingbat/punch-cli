const fs = require("fs");
const MON = require("@schwingbat/mon");

module.exports = function loadMONConfig(configPath) {
  const deref = require("../dereference-projects");
  const file = fs.readFileSync(configPath + ".mon").toString("utf8");
  const config = MON.parse(file);

  const { errors, projects } = deref(config);

  if (errors.length > 0) {
    for (const err of errors) {
      console.log(`CONFIG ERROR: ${err.message}`);
    }
  }

  config.configPath = configPath + ".mon";
  config.extension = ".mon";
  config.projects = projects;

  // Store project alias in project object
  if (config.projects) {
    for (const alias in config.projects) {
      config.projects[alias].alias = alias;
    }
  }

  return config;
};
