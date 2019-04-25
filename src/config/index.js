module.exports = function(configPath) {
  const fs = require("fs");
  const mkdirp = require("mkdirp");
  const path = require("path");
  const home = require("os").homedir();
  const merge = require("../utils/deep-merge.js");

  const punchPath = process.env.PUNCH_PATH || path.join(home, ".punch");

  if (!configPath) {
    configPath = path.resolve(path.join(punchPath, "punchconfig"));
  } else {
    configPath = path.resolve(configPath);
  }

  // Create the config path if it doesn't yet exist.
  mkdirp.sync(path.dirname(configPath));

  let defaults = require("./defaults.json");
  let loaded = {};

  // Load config from a file and merge it with the program defaults.
  if (fs.existsSync(configPath + ".yaml")) {
    loaded = require("./loaders/yaml.loader")(configPath);
  } else if (fs.existsSync(configPath + ".mon")) {
    loaded = require("./loaders/mon.loader")(configPath);
  } else if (fs.existsSync(configPath + ".json")) {
    console.log(
      "JSON config files are no longer supported. Please convert your punchconfig.json to YAML or MON."
    );
  } else {
    // If THAT doesn't work, yer screwed.
    // TODO: Probably want to warn people they're using the default config.
  }

  // Apply user config over defaults.
  const config = merge(defaults, loaded);

  // Set dynamic options.

  config.display.timeFormat = config.display.use24HourTime ? "H:mm" : "h:mm A";
  config.configPath = configPath + (config.extension || ".mon");
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

  return config;
};
