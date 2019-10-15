const fs = require("fs");
const path = require("path");
const home = require("os").homedir();
const chalk = require("chalk");
const mkdirp = require("mkdirp");

/**
 * Loads user configuration from any supported config file format.
 */
module.exports = (configPath = null) => {
  const punchPath = process.env.PUNCH_PATH || path.join(home, ".punch");

  if (!configPath) {
    configPath = path.resolve(path.join(punchPath, "punchconfig"));
  } else {
    configPath = path.resolve(configPath);
  }

  // Create the config path if it doesn't yet exist.
  mkdirp.sync(path.dirname(configPath));

  let loaded = {};

  // Load config from a file and merge it with the program defaults.
  if (fs.existsSync(configPath + ".mon")) {
    loaded = require("./loaders/mon.loader")(configPath);
  } else if (fs.existsSync(configPath + ".yaml")) {
    loaded = require("./loaders/yaml")(configPath);
  } else if (fs.existsSync(configPath + ".json")) {
    console.log(
      "JSON config files are no longer supported. Please convert your punchconfig.json to YAML or MON."
    );
  } else {
    console.log(
      chalk.yellow("WARNING") +
        " No user config file found. Using default configuration."
    );
  }

  loaded.punchPath = punchPath;

  return loaded;
};
