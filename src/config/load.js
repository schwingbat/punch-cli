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

  let inferredLoader = configPath
    ? path
        .extname(configPath)
        .slice(1)
        .toLowerCase()
    : null;
  let loader;

  if (inferredLoader && fs.existsSync(`./loaders/${inferredLoader}`)) {
    loader = require(`./loaders/${inferredLoader}`);
  }

  if (!configPath) {
    configPath = path.resolve(path.join(punchPath, "punchconfig"));
  } else {
    configPath = path.resolve(configPath);
  }

  // Create the config path if it doesn't yet exist.
  mkdirp.sync(path.dirname(configPath));

  let loaded = {};

  if (loader) {
    // Use the inferred loader if we have one.
    loaded = loader(configPath);
  } else {
    // Try file types until they stick.
    if (fs.existsSync(configPath + ".mon")) {
      loaded = require("./loaders/mon")(configPath);
    } else if (fs.existsSync(configPath + ".yaml")) {
      loaded = require("./loaders/yaml")(configPath);
    } else if (fs.existsSync(configPath + ".json")) {
      throw new Error(
        "JSON config files are no longer supported. Please convert your punchconfig.json to YAML or MON."
      );
    } else {
      console.log(
        chalk.yellow("WARNING") +
          " No user config file found. Using default configuration."
      );
    }
  }

  loaded.punchPath = punchPath;

  return loaded;
};
