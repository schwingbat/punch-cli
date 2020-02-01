const mkdirp = require("mkdirp");
const path = require("path");
const fs = require("fs");
const os = require("os");
const deepmerge = require("deepmerge");
const deref = require("./deref-projects");

let current = null;

/**
 * Returns default config merged with user config.
 *
 * @param {string} configPath - (Optional) explicit path to config file.
 */
exports.load = (configPath = null) => {
  const punchPath = process.env.PUNCH_PATH || path.join(os.homedir(), ".punch");

  if (!configPath) {
    configPath = path.resolve(path.join(punchPath, "punchconfig.json"));
  } else {
    configPath = path.resolve(configPath);
  }

  let userConfig = {};

  // Try to load the user's config.
  if (fs.existsSync(configPath)) {
    userConfig = require(configPath);
  } else {
    console.log(
      chalk.yellow("WARNING") +
        " No user config file found. Using default configuration."
    );
  }

  const defaults = require("./defaults.json");
  const config = deepmerge(defaults, userConfig);

  // Replace client names with references to actual client objects.
  const { errors, projects } = deref(config);

  if (errors.length > 0) {
    for (const err of errors) {
      console.log(`CONFIG ERROR: ${err.message}`);
    }
  }

  config.projects = projects;

  // Set dynamic options.
  config.punchPath = punchPath;
  config.configPath = configPath;
  config.symbols = require("../utils/symbols")(config);
  config.invoiceTemplatePath =
    config.invoiceTemplatePath || path.join(punchPath, "templates", "invoice");
  config.importerPath =
    config.importerPath || path.join(punchPath, "importers");
  config.exporterPath =
    config.exporterPath || path.join(punchPath, "exporters");

  if (config.display.textColors === false) {
    require("chalk").level = 0;
  }

  // Ensure customization directories exist.

  mkdirp(config.invoiceTemplatePath);
  mkdirp(config.importerPath);
  mkdirp(config.exporterPath);

  current = config;

  return config;
};

/**
 * Returns the current config. Loads configuration if no current config is set.
 */
exports.current = () => {
  if (!current) {
    current = exports.load();
  }

  return current;
};

/*=============================*\
||     FOR TESTING PURPOSES    ||
\*=============================*/

exports.__clear_current__ = () => {
  current = null;
};

exports.__get_raw_current__ = () => {
  return current;
};
