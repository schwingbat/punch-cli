/*
  Contains all the reusable methods for producing
  different headers and entries for reports.
*/

const chalk = require('chalk');

const slashList = (things, parens) => {
  let slashed = things.filter(t => t).join(chalk.grey(' / '));
  return parens
    ? chalk.grey('(') + slashed + chalk.grey(')')
    : slashed;
};

const labelTable = (items) => {
  let str = '';
  let length = items.reduce(
      (longest, item) =>
        item.label && item.label.length > longest
          ? item.label.length
          : longest,
        0);

  items.forEach(({ label, value }) => {
    if (!label) {
      str += '   ' + value + '\n';
    } else {
      str += `   ${(label + ':').padStart(length + 2)} ${value}\n`;
    }
  });

  return str;
};

function reportHeader(text, stats) {
  let str = '\n';

  str += '▋  ' + chalk.bold(text) + '\n';
  if (stats) {
    str += '▋  ' + slashList(stats);
  }

  return str;
};

function projectHeader(text, stats) {
  let str = '\n';

  str += chalk.bold.yellow('▋  ' + text) + '';
  if (stats) {
    str += ' ' + slashList(stats, true) + '\n';
  }

  return str;
};

function daySessions(sessions) {
  let str = '';

  sessions.forEach(session => {
    str += '      ';

    if (session.timeSpan.slice(session.timeSpan.length - 3).toLowerCase() === 'now') {
      str += chalk.green.bold.italic(session.timeSpan);
    } else {
      str += chalk.cyan.bold.italic(session.timeSpan);
    }

    if (session.comments.length > 0) {
      for (let i = 0; i < session.comments.length; i++) {
        const c = session.comments[i];
        if (!c) continue;

        if (i > 0) {
          str += '\n                         ' + chalk.grey(' » ') + c;
        } else {
          str += chalk.grey(' » ') + c;
        }
      }
    }

    str += '\n';
  });

  return str;
}

function projectDay({ date, stats, sessions }) {
  let str = '';

  str += chalk.grey('   ▶  ') + chalk.white.bold(date.format('MMM Do, dddd'));
  if (stats) {
    str += ' ' + slashList(stats, true) + '\n';
  }

  str += daySessions(sessions);

  return str;
};

function projectSummary({ name, pay, time, rate, stats }) {
  let str = '';

  str += projectHeader(name) + ' ' + slashList([pay, time, rate], true) + '\n\n';

  if (stats) {
    str += labelTable(stats);
  }

  return str;
};

module.exports = {
  slashList,
  labelTable,
  reportHeader,
  daySessions,
  projectHeader,
  projectDay,
  projectSummary,
};