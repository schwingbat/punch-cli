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

exports.reportHeader = function(text, stats) {
  let str = '\n';

  str += '▋  ' + chalk.bold(text) + '\n';
  str += '▋  ' + slashList(stats);

  return str;
};

exports.projectHeader = function(text, stats) {
  let str = '\n';

  str += chalk.bold.yellow('▋  ' + text) + '';
  str += ' ' + slashList(stats, true) + '\n';

  return str;
};

exports.projectDay = function({ date, stats, sessions }) {
  let str = '';

  str += chalk.grey('   ▶  ') + chalk.white.bold(date.format('MMM Do, dddd'));
  str += ' ' + slashList(stats, true) + '\n';

  sessions.forEach(session => {
    str += '      ';
    str += chalk.cyan.bold.italic(session.timeSpan);
    str += chalk.grey(' >>> ');
    str += session.comment || chalk.grey('No comment for session');
    str += '\n';
  });

  return str;
};

exports.slashList = slashList;