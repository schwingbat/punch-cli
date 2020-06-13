const chalk = require("chalk");

/**
 * Returns a colorizer function to print text in a project's theme color.
 *
 * @param {object} project - A project section from the config file.
 */
module.exports = function (project) {
  if (project && typeof project.color === "string") {
    const color = project.color.toLowerCase().trim();
    if (color[0] === "#") {
      return chalk.hex(color);
    } else {
      if (chalk[color] != null) {
        return chalk[color];
      }
    }
  }

  return chalk.yellow;
};
