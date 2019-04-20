module.exports = function(configPath) {
  const fs = require("fs");
  const mkdirp = require("mkdirp");
  const path = require("path");
  const home = require("os").homedir();
  const merge = require("../utils/deep-merge.js");
  const is = require("@schwingbat/is");
  const derefProjects = require("./deref-projects");

  const punchPath = process.env.PUNCH_PATH || path.join(home, ".punch");

  if (!configPath) {
    configPath = path.resolve(path.join(punchPath, "punchconfig"));
  } else {
    configPath = path.resolve(configPath);
  }

  mkdirp.sync(path.dirname(configPath));

  let config = require("./defaults.json");
  let configFormat;

  if (fs.existsSync(configPath + ".yaml")) {
    // Load YAML config file

    const yaml = require("js-yaml");

    const file = fs.readFileSync(configPath + ".yaml").toString("utf8");
    const parsed = yaml.safeLoad(file);
    config = merge(config, parsed);
    configFormat = ".yaml";

    const errors = derefProjects(config);

    if (errors.length > 0) {
      for (const e of errors) {
        console.log(`CONFIG ERROR: ${e}`);
      }
    }
  } else if (fs.existsSync(configPath + ".mon")) {
    // Try to load config from MON file.

    const MON = require("@schwingbat/mon");

    const file = fs.readFileSync(configPath + ".mon").toString("utf8");
    const parsed = MON.parse(file);
    config = merge(config, parsed);
    configFormat = ".mon";

    // Store project alias in project object
    for (const alias in config.projects) {
      config.projects[alias].alias = alias;
    }
  } else if (fs.existsSync(configPath + ".json")) {
    // If that doesn't work, try to load from JSON file.

    try {
      config = merge(config, require(configPath));
      configFormat = ".json";

      const errors = derefProjects(config);

      if (errors.length > 0) {
        for (const e of errors) {
          console.log(`CONFIG ERROR: ${e}`);
        }
      }
    } catch (err) {}

    // Turn addresses into strings
    if (is.object(config.user.address)) {
      const { street, city, state, zip } = config.user.address;
      config.user.address = `${street}\n${city}, ${state} ${zip}`;
    }

    for (const client in config.clients) {
      const c = config.clients[client];
      if (is.object(c.address)) {
        const { street, city, state, zip } = c.address;
        c.address = `${street}\n${city}, ${state} ${zip}`;
      }
    }
  } else {
    // If THAT doesn't work, yer screwed.
    // No config file found
  }

  config.display.timeFormat = config.display.use24HourTime ? "H:mm" : "h:mm A";

  config.configPath = configPath + (configFormat || ".mon");
  config.punchPath = punchPath;
  config.symbols = require("../utils/symbols")(config);
  config.invoiceTemplatePath =
    config.invoiceTemplatePath || path.join(punchPath, "templates", "invoice");
  config.importerPath =
    config.importerPath || path.join(punchPath, "importers");
  config.exporterPath =
    config.exporterPath || path.join(punchPath, "exporters");

  mkdirp(config.invoiceTemplatePath);
  mkdirp(config.importerPath);
  mkdirp(config.exporterPath);

  if (config.display.textColors === false) {
    require("chalk").level = 0;
  }

  return config;
};
