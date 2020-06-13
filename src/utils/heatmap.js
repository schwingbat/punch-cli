/*
 * Takes an array of punches and returns a heatmap showing
 * which times of day you tend to work the most.
 *
 * There are a few different heatmap functions depending on
 * how you want to visualize the data.
 */

const startOfDay = require("date-fns/startOfDay");
const chalk = require("chalk");

const zeroArray = (length) => {
  const arr = [];
  for (let i = 0; i < length; i++) {
    arr.push(0);
  }
  return arr;
};

const collapseToLevels = (segments) => {
  // Get max value so we can clamp the segments into relative levels.
  let max = 0;

  for (let i = 0; i < segments.length; i++) {
    if (segments[i] > max) {
      max = segments[i];
    }
  }

  // Divide sums into four levels (0, 1, 2 and 3)
  return segments.map((s) => {
    let val = (s / max) * 3;

    // If we have a fractional value, consider it level 1.
    // Otherwise round it into its final value.
    if (val > 0 && val < 1) {
      val = 1;
    } else {
      val = Math.round(val);
    }

    return val;
  });
};

function day(punches, config, opts = {}) {
  const segments = zeroArray(48);

  // const mapLevels = [
  //   chalk.grey("▊"), // 0
  //   chalk.green("▊"), // 1
  //   chalk.yellow("▊"), // 2
  //   chalk.red("▊") // 3
  // ];

  const mapLevels = [
    chalk.grey("▁"), // 0
    chalk.green("▃"), // 1
    chalk.yellow("▆ "), // 2
    chalk.red("▉"), // 3
  ];

  // Add 1 to each 30 minute segment the punch overlaps with.
  for (const punch of punches) {
    const start = startOfDay(punch.in);
    const first = punch.in.getTime() - start.getTime();
    const last = (punch.out || new Date()).getTime() - start.getTime();

    const f = Math.round((first / 1000 / 60 / 60) * 2);
    const l = Math.round((last / 1000 / 60 / 60) * 2);

    for (let i = f; i < l; i++) {
      segments[i % 48] += 1;
    }
  }

  const topRow = config.display.use24HourTime
    ? "00. . . . . 06. . . . . 12. . . . . 18. . . . ."
    : "12. . 3 . . 6 . . 9 . . 12. . 3 . . 6 . . 9 . .";

  const map = collapseToLevels(segments)
    .map((s) => mapLevels[s])
    .join("");

  return (
    "".padEnd(opts.labelPadding || 3) +
    topRow +
    "\n" +
    "HEATMAP".padEnd(opts.labelPadding || 3) +
    map +
    "\n"
  );
}

function week(punches, config, opts = {}) {
  const segments = zeroArray(7);

  const mapLevels = [
    chalk.grey("▂▂▂▂"),
    chalk.green("▄▄▄▄"),
    chalk.yellow("▅▅▅▅"),
    chalk.red("████"),
  ];

  for (const punch of punches) {
    const startDay = punch.in.getDay();
    const endDay = (punch.out || new Date()).getDay();

    segments[startDay] += 1;
    if (startDay !== endDay) {
      segments[endDay] += 1;
    }
  }

  const topRow = " SU  MO  TU  WE  TH  FR  SA ";

  const map = collapseToLevels(segments)
    .map((s) => mapLevels[s])
    .join("");

  return (
    "".padEnd(opts.labelPadding || 3) +
    topRow +
    "\n" +
    "HEATMAP".padEnd(opts.labelPadding || 3) +
    map +
    "\n"
  );
}

function month(punches, config) {
  const segments = zeroArray(31);
  const topRow = "SU  MO  TU  WE  TH  FR  SA  ";
}

module.exports = {
  day,
  week,
  month,
};
