const { spawn } = require("child_process");

module.exports = command =>
  command
    .description(
      "open config file in editor - uses EDITOR env var unless an editor flag is specified."
    )
    .flag("editor", "e", {
      description: "editor command (vim, code, etc.)"
    })
    .action((args, props) => {
      const { config } = props;

      const editor =
        args.flags.editor ||
        process.env.VISUAL ||
        process.env.EDITOR ||
        (/^win/.test(process.platform) ? "notepad" : "vim");

      spawn(editor, [config.configPath], { stdio: "inherit" });
    });
