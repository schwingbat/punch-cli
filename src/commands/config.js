const { spawn } = require("child_process");
const fs = require("fs");
const util = require("util");
const chalk = require("chalk");

const { Command } = require("@ratwizard/cli");

module.exports = new Command()
  .description("open config file in editor")
  .option("-e, --editor <name>", {
    description: "editor command (vim, code, etc.)",
  })
  .option("-v, --validate", {
    description: "validate config file against the config schema",
    boolean: true,
  })
  .action(({ options, props }) => {
    const { config } = props;

    if (options.validate) {
      const validate = require("../config/validate");
      const value = fs.readFileSync(config.configPath, "utf-8");
      const json = JSON.parse(value);

      console.log();
      console.time("validate");

      const { valid, errors } = validate(json);

      console.timeEnd("validate");
      console.log();

      let str = "";

      for (const e of errors) {
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

      str += "\n";

      if (valid) {
        str += chalk.green("✓") + " Config file is valid.";
      } else {
        str += chalk.red("✕") + " Config file has errors.";
      }

      console.log(str);
    } else {
      // If not validating, we're editing the config file.
      const editor =
        options.editor ||
        process.env.VISUAL ||
        process.env.EDITOR ||
        (/^win/.test(process.platform) ? "notepad" : "vim");

      spawn(editor, [config.configPath], { stdio: "inherit" });
    }
  });
