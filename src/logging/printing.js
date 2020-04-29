/*
  Contains all the reusable methods for producing
  different headers and entries for reports.
*/
const chalk = require("chalk");
const moment = require("moment-timezone");
const Table = require("../format/table");
const formatCurrency = require("../format/currency");
const formatDuration = require("../format/duration");
const wordWrap = require("@fardog/wordwrap")(0, 80, {
  lengthFn: require("../utils/print-length.js"),
});
const realTime = require("../utils/real-time");
const PunchFormatter = require("../format/punch");

function delimitedList(items, inners = " / ", outers) {
  let joined = items.filter((i) => i).join(chalk.grey(inners));
  if (outers) {
    joined = chalk.grey(outers[0]) + joined + chalk.grey(outers[1]);
  }
  return joined;
}

const labelTable = (items) => {
  let str = "";
  let length = items.reduce(
    (longest, item) =>
      item.label && item.label.length > longest ? item.label.length : longest,
    0
  );

  items.forEach(({ label, value }) => {
    if (!label) {
      str += "   " + value + "\n";
    } else {
      str += `   ${(label + ":").padStart(length + 2)} ${value}\n`;
    }
  });

  return str;
};

function reportHeader(text, stats) {
  let str = "\n";

  str += " " + chalk.bold(text) + "\n";
  if (stats) {
    str += " " + delimitedList(stats);
  }

  return str;
}

function projectHeader(text, stats) {
  let str = "";

  str += chalk.bold.yellow(" " + text);
  if (stats) {
    str +=
      " " +
      delimitedList(
        stats.filter((s) => s).map((s) => s.toString()),
        " / ",
        ["(", ")"]
      );
  }

  return str;
}

/* Takes an array like so:
{
  punch: [{
    alias: "punch",
    name: "Punch",
    time: 91902831,
    pay: 89.00,
    punches: 2
  }, {
    alias: "dash"
    ...
  }]
}
*/
function summaryTable(projects, opts = {}) {
  let str = "";

  opts = Object.assign(
    {
      total: true,
    },
    opts
  );

  let total = {
    time: 0,
    pay: 0,
    punchCount: 0,
  };

  const table = new Table({
    columnStyle: [
      {
        align: "left",
        leftPadding: 0,
        rightPadding: 1,
      },
      {
        align: "right",
        leftPadding: 1,
        rightPadding: 1,
      },
      {
        align: "right",
        leftPadding: 1,
        rightPadding: 1,
      },
      {
        align: "right",
        leftPadding: 1,
        rightPadding: 0,
      },
    ],
  });

  projects.forEach((project) => {
    total.time += project.time;
    total.pay += project.pay;
    total.punchCount += project.punches.length;

    table.push([
      chalk.yellow(project.name),
      formatDuration(project.time, { resolution: "m", padded: true }),
      project.isPaid ? formatCurrency(project.pay) : chalk.grey("---"),
      project.punches.length +
        " punch" +
        (project.punches.length === 1 ? "" : "es"),
    ]);
  });

  str += table.toString();

  if (opts.total) {
    const punches = [];

    for (const project of projects) {
      punches.push(
        ...project.punches.map((p) => ({
          start: p.in,
          end: p.out || new Date(),
        }))
      );
    }

    const rtime = realTime(punches, { start: opts.start, end: opts.end });
    const time = formatDuration(total.time);

    // Display to the second would look different.
    const timeDiffers = ~~(rtime / 1000) !== ~~(total.time / 1000);

    str += "\n" + chalk.bold.cyan("TOTAL") + " ";
    str += delimitedList(
      [
        timeDiffers ? `${formatDuration(rtime)} ${chalk.cyan("[Real]")}` : null,
        timeDiffers ? `${time} ${chalk.cyan("[Tracked]")}` : time,
        formatCurrency(total.pay),
        total.punchCount + " punch" + (total.punchCount === 1 ? "" : "es"),
      ].filter((x) => x),
      " / ",
      ["(", ")"]
    );
  }

  return str;
}

function monthSummaryHeader({ date, stats, dateFormat }) {
  let header = "";
  header += chalk.bold.underline(
    moment(date).format(dateFormat || "MMMM yyyy")
  );
  if (stats) {
    header += " " + delimitedList(stats, " / ", ["(", ")"]);
  }
  return header + "\n";
}

/*
 * A date header followed by an entry for each punch occurring on a given day.
 */

function projectDay({ date, stats, punches, config }) {
  let str = "";

  str +=
    "" +
    daySummaryHeader({ date, stats, dateFormat: config.display.dateFormat }) +
    "\n";
  str += "  " + dayPunches(punches, date, config).replace(/\n/g, "\n  ");

  return str;
}

function daySummaryHeader({ date, stats, dateFormat }) {
  let header = "";
  header += chalk.bold.underline(moment(date).format(dateFormat));

  if (stats) {
    header += " " + delimitedList(stats, " / ", ["(", ")"]);
  }
  return header + "\n";
}

function dayPunches(punches, date) {
  let str = "";
  for (const punch of punches) {
    const formatter = new PunchFormatter(punch, { date });
    str += formatter.header();
    formatter.comments().forEach((comment) => {
      str += comment.format() + "\n";
    });
  }
  return str;
}

// TODO: Factor out - only used in formatting preview input in data:import command.
function simplePunches(punches, config) {
  const symbols = config.symbols;
  let str = "";

  punches.forEach((punch) => {
    let out = punch.out || new Date();

    let timeSpan = "";
    timeSpan +=
      moment(punch.in).format(config.display.timeFormat).padStart(8) + " - ";
    if (punch.out) {
      timeSpan += moment(out).format(config.display.timeFormat).padStart(8);
    } else {
      timeSpan += "NOW".padStart(8);
    }

    if (punch.out) {
      timeSpan = chalk.cyan(timeSpan);
    } else {
      timeSpan = chalk.bold.green(timeSpan);
    }

    const project = config.projects[punch.project];
    const projectName = project ? project.name : punch.project;
    let time;
    const hours = punch.duration() / 3600000;
    if (hours < 1) {
      time = `${~~(hours * 60)}m`;
    } else {
      time = `${hours.toFixed(1)}h`;
    }

    str += timeSpan;
    str += chalk.blue(time.padStart(6));
    str += chalk.yellow(` [${projectName}]`);
    if (punch.rate) {
      str += chalk.grey(` ($${punch.pay().toFixed(2)})`);
    }
    str += "\n";

    if (config.display.showPunchIDs) {
      str += "   " + chalk.grey(`ID: ${punch.id}`) + "\n";
    }

    if (punch.comments.length > 0) {
      punch.comments.forEach((comment, i) => {
        str += chalk.grey(`   ${symbols.logSessionBullet} `);
        if (config.display.showCommentIndices) {
          str += chalk.bold(`[${i}] `);
        }
        if (config.display.showCommentTimestamps) {
          str +=
            moment(comment.timestamp).format(config.display.timeFormat) + ": ";
        }
        str += wordWrap(comment.toString()).replace("\n", "\n     ");

        if (punch.comments[i + 1]) {
          str += "\n";
        }
      });
      str += "\n";
    }
  });

  return str;
}

function projectSummary({ name, description, pay, time, rate, stats }) {
  let str = "";
  const statList = [time];

  if (pay) statList.push(pay);
  if (rate) statList.push(rate);

  str +=
    projectHeader(name) +
    " " +
    delimitedList(statList, " / ", ["(", ")"]) +
    "\n";
  str += `${chalk.grey(" >")} ${wordWrap(description).replace(
    "\n",
    chalk.grey("\n > ")
  )}\n\n`;

  if (stats) {
    str += labelTable(stats);
  }

  return str;
}

module.exports = {
  delimitedList,
  labelTable,
  reportHeader,
  dayPunches,
  simplePunches,
  summaryTable,
  daySummaryHeader,
  monthSummaryHeader,
  projectHeader,
  projectDay,
  projectSummary,
};
