const startOfDay = require("date-fns/startOfDay");
const endOfDay = require("date-fns/endOfDay");
const addMinutes = require("date-fns/addMinutes");
const closestIndexTo = require("date-fns/closestIndexTo");
const chalk = require("chalk");
const summarize = require("./summarize");
const formatCurrency = require("../format/currency");
const formatDuration = require("../format/duration");
const makeColorizer = require("../utils/make-project-colorizer");
const Table = require("../format/table");
const { padStartRaw, padEndRaw } = require("../utils/pad-raw");

const onChar = "▅";
const offChar = "▂";
const lineLength = 48;

module.exports = function ({ punches, date, labelPadding, config }) {
  let topRow = config.display.use24HourTime
    ? "|0    |3    |6    |9    |12   |15   |18   |21   "
    : "|12a  |3a   |6a   |9a   |12p  |3p   |6p   |9p   ";

  topRow = topRow.replace(/\|/g, chalk.grey("▏"));

  let start = startOfDay(date);
  let end = endOfDay(start);
  let longestName = 0;

  const summaries = summarize(config, punches, { start, end });

  // Prepare initial empty lines and metadata.
  for (const project of summaries) {
    const color = config.projects[project.alias].color || "yellow";
    const [workdayStart, workdayEnd] = config.projects[
      project.alias
    ].businessHours.map((x) => x * (lineLength / 24));
    const colorize = makeColorizer({ color });

    let line = [];
    for (let i = 0; i < lineLength; i++) {
      if (i >= workdayStart && i <= workdayEnd) {
        line.push(chalk.bgGrey(offChar));
      } else {
        line.push(colorize(offChar));
      }
    }

    project.line = line;
    project.color = color;
    project.businessHours = [workdayStart, workdayEnd];

    if (project.name.length > longestName) {
      longestName = project.name.length;
    }
  }

  // Generate array of date increments for time snapping.
  const inc = 24 / lineLength;
  const increments = [];
  let cursorDate = start;

  for (let i = 0; i < lineLength; i++) {
    increments.push(new Date(cursorDate));
    cursorDate = addMinutes(cursorDate, inc * 60);
  }

  // Calculate each project's line layout.
  for (const project of summaries) {
    const colorize = makeColorizer(project);
    const [workdayStart, workdayEnd] = project.businessHours;

    for (const punch of project.punches) {
      const start = Math.max(
        0,
        Math.min(lineLength, closestIndexTo(punch.in, increments))
      );
      const end = Math.max(
        0,
        Math.min(
          lineLength,
          closestIndexTo(punch.out || new Date(), increments)
        )
      );

      for (let i = start; i <= end; i++) {
        project.line[i] = !punch.out ? chalk.green(onChar) : colorize(onChar);

        if (i >= workdayStart && i <= workdayEnd) {
          project.line[i] = chalk.bgBlackBright(project.line[i]);
        }
      }
    }
  }

  if (!labelPadding) {
    labelPadding = longestName + 3;
  }

  const table = new Table({
    columnStyle: [
      {
        align: "right",
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

  summaries.forEach((project) => {
    table.push([
      formatDuration(project.time, { resolution: "m", padded: true }),
      project.isPaid ? formatCurrency(project.pay) : chalk.grey("---"),
      project.punches.length +
        " punch" +
        (project.punches.length === 1 ? "" : "es"),
    ]);
  });

  const tableLines = table.toString().split("\n");

  let str = "";

  for (const project of summaries) {
    const colorize = makeColorizer(project);
    const label = colorize.bold(project.name);
    const stats = chalk.bold(
      padStartRaw(tableLines.shift().trim(), lineLength - project.name.length)
    );
    const prefix = "  ";

    str += prefix + label + stats + "\n";
    str += prefix + project.line.join("") + "\n";
    str += prefix + topRow + "\n";
    str += "\n";
  }

  return str;
};
