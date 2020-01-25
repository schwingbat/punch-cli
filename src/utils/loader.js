const loaders = {
  braille: ["⣾", "⣽", "⣻", "⢿", "⡿", "⣟", "⣯", "⣷"],
  spinner: ["|", "/", "-", "\\"],
  transfer: [
    "[-------]",
    "[>------]",
    "[<>-----]",
    "[-<>----]",
    "[--<>---]",
    "[---<>--]",
    "[----<>-]",
    "[-----<>]",
    "[------<]"
  ],
  tris: ["◢", "◣", "◤", "◥"]
};

module.exports = function({
  text = "Loading...",
  animation = "braille",
  stopText,
  fps = 12
} = {}) {
  const chalk = require("chalk");
  const logUpdate = require("log-update");

  // Use an ASCII-compatible loader when --no-unicode is passed.
  if (
    (process.argv.includes("--no-unicode") &&
      !["spinner", "transfer"].includes(animation)) ||
    require("os").platform() === "win32"
  ) {
    animation = "spinner";
  }

  let interval;
  let frames = loaders[animation];
  let i = 0;

  return {
    start(startText = text) {
      if (!interval) {
        i = 0;
        interval = setInterval(() => {
          logUpdate(chalk.yellow(frames[i]) + " " + startText);
          i = (i + 1) % frames.length;
        }, 1000 / fps);
      }
      return this;
    },
    update(newText = text) {
      clearInterval(interval);
      interval = setInterval(() => {
        logUpdate(chalk.yellow(frames[i]) + " " + newText);
        i = (i + 1) % frames.length;
      }, 1000 / fps);
    },
    stop(stopText) {
      clearInterval(interval);
      interval = null;
      i = 0;

      if (stopText) {
        logUpdate(stopText);
      }
    }
  };
};
