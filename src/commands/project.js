const { Command } = require("@ratwizard/cli");

const { formatDate } = require("../format/date");
const formatDuration = require("../format/duration");
const formatDistance = require("date-fns/formatDistance");
const formatCurrency = require("../format/currency");

const moment = require("moment-timezone");
// const startOfMonth = require("date-fns/startOfMonth");
// const addDays = require("date-fns/addDays");
// const endOfMonth = require("date-fns/endOfMonth");
// const { ascendingBy } = require("../utils/sort-factories");
// const { projectSummary } = require("../logging/printing");
// const formatSummary = require("../format/project-summary");
// const getLabelFor = require("../utils/get-label-for");
// const padWithLines = require("../logging/pad-with-lines");

const makeProjectColorizer = require("../utils/make-project-colorizer");
const wordWrap = require("@fardog/wordwrap")();
const chalk = require("chalk");

module.exports = new Command()
  .description("show detailed stats for a project")
  .arg("alias", {
    description: "a project alias",
  })
  .action(async ({ args, props }) => {
    const { config, Punch } = props;

    const project = config.projects[args.alias];
    const punches = await Punch.filter((p) => p.project === args.alias);

    const colorize = makeProjectColorizer(project);

    const totalPunches = punches.length;
    let earliestPunch;
    let latestPunch;
    let longestPunch;
    let totalMilliseconds = 0;

    for (const punch of punches) {
      if (earliestPunch == null || punch.in < earliestPunch.in) {
        earliestPunch = punch;
      }

      if (
        latestPunch == null ||
        punch.out == null ||
        punch.out > latestPunch.out
      ) {
        latestPunch = punch;
      }

      let duration = punch.duration();

      if (longestPunch == null || longestPunch.duration() < duration) {
        longestPunch = punch;
      }

      totalMilliseconds += duration;
    }

    console.log("\n" + chalk.underline.bold(colorize(project.name)));

    if (project.description) {
      console.log(chalk.gray(">") + " " + wordWrap(project.description));
    }

    /*==========================*\
    ||      Client & Money      ||
    \*==========================*/

    if (project.client) {
      console.log();
      console.log(`Client: ${project.client.name}`);
    }

    if (project.hourlyRate) {
      console.log(`Rate:   $${project.hourlyRate}/hr`);
    }

    /*==========================*\
    ||       General Stats      ||
    \*==========================*/

    const lastActive = latestPunch.out
      ? formatDistance(latestPunch.out, new Date()) + " ago"
      : chalk.bold.green("Now");

    console.log();
    console.log(`Total Punches: ${totalPunches}`);
    console.log(`Total Time:    ${formatDuration(totalMilliseconds)}`);
    console.log(`Started On:    ${formatDate(earliestPunch.in)}`);
    console.log(`Last Active:   ${lastActive}`);

    /*==========================*\
    ||      Invoice Period      ||
    \*==========================*/

    // Designed to handle monthly invoices - will need update to deal with other invoicing styles.

    if (project.invoicePeriod) {
      const businessDays = project.businessDays;
      const interval = getInvoiceBounds(project.invoicePeriod);

      let remainingDays = 0;
      let remainingWorkingDays = 0;
      let totalDuration = 0;
      let totalPay = 0;

      for (const punch of punches) {
        totalDuration += punch.durationWithinInterval(interval);
        totalPay += punch.payWithinInterval(interval);
      }

      // Q: Should remaining days include the current day?
      let date = moment().add(1, "day");
      let workEnd = moment(interval.end);

      while (date <= workEnd) {
        remainingDays++;

        if (businessDays.includes(date.day())) {
          remainingWorkingDays++;
        }

        date = date.add(1, "day");
      }

      console.log();
      console.log(`Worked this invoice: ${formatDuration(totalDuration)}`);
      console.log(`Earned this invoice: ${formatCurrency(totalPay)}`);

      if (project.targetHours) {
        const remainingTimeToTarget =
          project.targetHours * 60 * 60 * 1000 - totalDuration;

        console.log();
        console.log(
          `Remaining to target (${project.targetHours}h):\n  ${formatDuration(
            remainingTimeToTarget
          )}`
        );
        console.log(`Remaining working days:\n  ${remainingWorkingDays}`);
        console.log(
          `Avg per remaining working day:\n  ${formatDuration(
            remainingTimeToTarget / remainingWorkingDays
          )}`
        );
      }
    }
  });

function getInvoiceBounds(config, referenceDate = new Date()) {
  let start;
  let end;

  const now = referenceDate;
  const date = now.getDate();

  switch (config.schedule.toLowerCase()) {
    case "monthly": {
      let value = config.endDate;

      if (typeof value === "string") {
        const str = config.endDate.toLowerCase();

        if (str === "first") {
          start = moment(now).startOf("month").date();
        } else if (str === "last") {
          start = moment(now).startOf("month").subtract(1, "month").date();
        }
      }

      // Determine whether we're past the end and into the next month.
      if (date <= value) {
        end = moment(now).set("date", value).endOf("day").valueOf();
      } else {
        end = moment(now)
          .set("date", value)
          .add(1, "month")
          .endOf("day")
          .valueOf();
      }

      start = moment(end)
        .subtract(1, "month")
        .add(1, "day")
        .startOf("day")
        .valueOf();
    }
  }

  return {
    start,
    end,
  };
}
