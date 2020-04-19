const { spawn } = require("child_process");

const { Command } = require("@ratwizard/cli");

module.exports = new Command()
  .description("open config file in editor")
  .option("-e, --editor <name>", {
    description: "editor command (vim, code, etc.)",
  })
  .action(({ options, props }) => {
    const { config } = props;

    const editor =
      options.editor ||
      process.env.VISUAL ||
      process.env.EDITOR ||
      (/^win/.test(process.platform) ? "notepad" : "vim");

    spawn(editor, [config.configPath], { stdio: "inherit" });
  });
