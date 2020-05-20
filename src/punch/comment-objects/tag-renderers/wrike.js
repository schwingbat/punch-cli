const chalk = require("chalk");
const link = require("terminal-link");

/**
 * Renders a #wrike[<permalink-url>] or #wrike[<task-id>] tag.
 */
module.exports = function (name, params) {
  if (params[0]) {
    // Try parsing full permalink URL
    let matches = params[0].match(/\=(\d+)$/);
    if (!matches) {
      // Try parsing as just a task ID
      matches = params[0].match(/^(\d+)$/);
    }

    if (matches) {
      const url = "https://www.wrike.com/open.htm?id=" + matches[1];
      return link(chalk.green(`#wrike[${matches[1]}]`), url);
    }
  }

  return chalk.green("#" + name);
};
