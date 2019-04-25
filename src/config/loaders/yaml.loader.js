const fs = require("fs");
const yaml = require("js-yaml");
const derefProjects = require("../deref-projects");

module.exports = function loadYAMLConfig(configPath) {
  const file = fs.readFileSync(configPath + ".yaml").toString("utf8");
  const config = yaml.safeLoad(file);

  config.extension = ".yaml";

  const errors = derefProjects(config);

  if (errors.length > 0) {
    for (const e of errors) {
      console.log(`CONFIG ERROR: ${e}`);
    }
  }

  return config;
};
