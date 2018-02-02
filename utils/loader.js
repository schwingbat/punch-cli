const loaders = {
  braille: ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'],
  spinner: ['|', '/', '-', '\\'],
  transfer: [
    '[>------]',
    '[<>-----]',
    '[-<>----]',
    '[--<>---]',
    '[---<>--]',
    '[----<>-]',
    '[-----<>]',
    '[------<]',
  ],
  tris: ['◢', '◣', '◤', '◥'],
};

module.exports = function({ text, animation = 'braille', stopText, fps = 12 }) {
  const chalk = require('chalk');
  const logUpdate = require('log-update');

  let interval;
  let frames = loaders[animation];
  let i = 0;

  return {
    start() {
      if (!interval) {
        i = 0;
        interval = setInterval(() => {
          logUpdate(chalk.yellow(frames[i]) + ' ' + text);
          i = (i + 1) % frames.length;
        }, 1000 / fps);
      }
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
