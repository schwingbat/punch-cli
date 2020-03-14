const { spawn } = require("child_process");

module.exports = command =>
  command
    .description("open config file in editor")
    .flag("editor", "e", {
      description: "editor command (vim, code, etc.)"
    })
    .run(({ flags, props }) => {
      const { config } = props;

      const editor =
        flags.editor ||
        process.env.VISUAL ||
        process.env.EDITOR ||
        (/^win/.test(process.platform) ? "notepad" : "vim");

      spawn(editor, [config.configPath], { stdio: "inherit" });
    });
