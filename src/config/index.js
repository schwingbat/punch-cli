const mkdirp = require("mkdirp");
const path = require("path");
const fs = require("fs");
const os = require("os");
const merge = require("mergerino");
const chalk = require("chalk");
const deref = require("./deref-projects");
const validate = require("./validate");

let current = null;

const daysMap = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 0,
  tue: 2,
  tuesday: 3,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

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
    userConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } else {
    console.log(
      chalk.yellow("WARNING") +
        " No user config file found. Using default configuration."
    );
  }

  const { valid, ...validation } = validate(userConfig);

  // Show errors if config is invalid.
  if (!valid) {
    const chalk = require("chalk");
    let str = "";

    for (const e of validation.errors) {
      switch (e.type) {
        case "error":
          str += "🛑 " + chalk.red(e.message) + "\n";
          break;
        case "warning":
          str += "⚠️  " + chalk.yellow(e.message) + "\n";
          break;
        default:
          str += e.message + "\n";
          break;
      }
    }

    console.log("\n" + str);

    throw new Error("Config file has errors.");
  }

  const defaults = require("./defaults.json");
  const config = merge(defaults, userConfig);

  // Replace client names with references to actual client objects.
  const { errors, projects } = deref(config);

  if (errors.length > 0) {
    for (const err of errors) {
      console.log(`CONFIG ERROR: ${err.message}`);
    }
  }

  config.projects = projects;

  // Load business hours range. Used for highlighting graphics.
  for (const alias in projects) {
    const project = projects[alias];

    if (Array.isArray(project.businessHours)) {
      if (project.businessHours.length !== 2) {
        throw new Error(
          `[config parse][${alias}] businessHours must be an array with start and end hour, e.g. [8, 17]`
        );
      }
    } else {
      // Won't cause errors from being null, but won't render either.
      project.businessHours = [9, 17];
    }

    if (project.businessDays == null) {
      project.businessDays = [0, 1, 2, 3, 4, 5, 6];
    }

    project.businessDays = project.businessDays
      .map((d) => (typeof d === "string" ? daysMap[d] : d))
      .sort();
  }

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
