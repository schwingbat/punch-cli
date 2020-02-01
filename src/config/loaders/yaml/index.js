/**
 * Loads user configuration from a YAML file at the given path.
 *
 * @param {string} configPath - Path to the YAML file.
 */
module.exports = function loadYAMLConfig(configPath) {
  const fs = require("fs");
  const yaml = require("js-yaml");
  const deref = require("../dereference-projects");

  const file = fs.readFileSync(configPath + ".yaml").toString("utf8");
  const config = yaml.safeLoad(file);

  const { errors, projects } = deref(config);

  if (errors.length > 0) {
    for (const err of errors) {
      console.log(`CONFIG ERROR: ${err.message}`);
    }
  }

  config.configPath = configPath + ".yaml";
  config.extension = ".yaml";
  config.projects = projects;

  return config;
};
