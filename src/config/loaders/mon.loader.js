const fs = require("fs");
const MON = require("@schwingbat/mon");

module.exports = function loadMONConfig(configPath) {
  const file = fs.readFileSync(configPath + ".mon").toString("utf8");
  const config = MON.parse(file);

  config.extension = ".mon";

  // Store project alias in project object
  if (config.projects) {
    for (const alias in config.projects) {
      config.projects[alias].alias = alias;
    }
  }

  return config;
};
