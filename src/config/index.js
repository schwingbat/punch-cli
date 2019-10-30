const loadConfig = require("./load");

let current = null;

/**
 * Returns default config merged with user config.
 *
 * @param {string} configPath - (Optional) explicit path to config file.
 */
exports.load = (configPath = null) => {
  const mkdirp = require("mkdirp");
  const path = require("path");
  const merge = require("lodash/merge");

  const defaults = require("./defaults.js");
  const userConfig = loadConfig(configPath);

  const config = merge(defaults, userConfig);

  const { punchPath } = config;

  // Set dynamic options.
  config.punchPath = punchPath;
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
}

exports.__get_raw_current__ = () => {
  return current;
}