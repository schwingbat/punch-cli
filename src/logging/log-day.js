/*
  Show punches chronologically in this format:
    11:45am - 5:52pm [BidPro Admin] >> some comment here
                                    >> other comment here
     6:12pm - 8:15pm [SCC Graphics] >> finished poster
     8:20pm - 1:27am [BidPro]       >> some comment here

  Followed by a projects summary:
    Project    3h 27m 16s    $124.52    1 punch
    ...
*/

module.exports = function ({
  config,
  punches,
  date,
  summary,
  project,
  interval,
}) {
  const { ascendingBy } = require("../utils/sort-factories");
  const { dayPunches, summaryTable, daySummaryHeader } = require("./printing");
  const dayGraphic = require("./day-graphic");
  const formatDate = require("date-fns/format");

  if (punches.length === 0) {
    const isSameDay = require("date-fns/isSameDay");
    const addDays = require("date-fns/addDays");
    const messageFor = require("../utils/message-for");
    let message;

    if (isSameDay(date, new Date())) {
      message = messageFor("no-sessions-today");
    } else if (isSameDay(date, addDays(new Date(), -1))) {
      message = messageFor("no-sessions-yesterday");
    } else {
      message =
        "No sessions for " + formatDate(date, config.display.dateFormat);
    }

    return console.log("\n" + message);
  }

  punches = punches
    .filter((punch) => !project || punch.project !== project)
    .sort(ascendingBy("in"));

  console.log(
    `\n${daySummaryHeader({ date, dateFormat: config.display.dateFormat })}`
  );
  console.log("  " + dayPunches(punches, date, config).replace(/\n/g, "\n  "));

  if (config.display.showDayGraphics) {
    process.stdout.write(
      dayGraphic({
        punches,
        date,
        config,
      })
    );
  } else {
    const start = new Date(date);
    const end = new Date(date);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    console.log(summaryTable(summary, { start, end }) + "\n");
  }
};
