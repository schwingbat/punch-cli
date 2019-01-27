const { spawn } = require("child_process");

module.exports = ({ config }) => ({
  signature: "config",
  description: "open config file in editor - uses EDITOR env var unless an editor flag is specified.",
  options: [{
    name: "editor",
    short: "e",
    description: "editor command (vim, code, etc.)",
    type: "string",
    default: function () {
      return process.env.VISUAL ||
        process.env.EDITOR ||
        (/^win/.test(process.platform) ? "notepad" : "vim");
    }
  }],
  run: function (args) {
    spawn(args.options.editor, [config.configPath], { stdio: "inherit" });
  }
});