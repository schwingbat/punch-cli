const route = require("express").Router();
const moment = require("moment-timezone");
const formatDistanceToNow = require("date-fns/formatDistanceToNow");

const { descendingBy } = require("../../utils/sort-factories");

route.get("/", async function (req, res) {
  const { props } = req;
  const { projects } = props.config;

  res.render("sections/projects/index", { projects, props });
});

route.get("/:alias", async function (req, res) {
  const { props } = req;
  const { config, Punch } = props;
  const { projects } = config;

  const project = projects[req.params.alias];

  if (project) {
    const currentPunch = (await Punch.current(project.alias))[0];

    const recentPunches = (
      await Punch.filter((p) => p.out != null && p.project === project.alias)
    )
      .sort(descendingBy("in"))
      .slice(0, 3);

    let lastActiveLabel = "Never";

    if (currentPunch) {
      lastActiveLabel = "Now";
    } else if (recentPunches.length > 0) {
      const mostRecent = recentPunches[0];

      lastActiveLabel = formatDistanceToNow(mostRecent.out, {
        addSuffix: true,
      });
    }

    let totalDuration = 0;
    let totalPay = 0;

    const projectPunches = await Punch.filter(
      (p) => p.project === project.alias
    );
    projectPunches.forEach((punch) => {
      totalDuration += punch.duration();
      totalPay += punch.pay();
    });

    res.render("sections/projects/show", {
      project,
      specifiesBusinessDays:
        project.businessDays && project.businessDays.length !== 7,
      currentPunch,
      recentPunches,
      totalDuration,
      totalPay,
      lastActiveLabel,
      invoice: await getInvoiceStats(project, Punch),
    });
  } else {
    // TODO: Show 404
  }
});

async function getInvoiceStats(project, Punch) {
  if (!project.invoicePeriod) {
    return null;
  }

  const punches = await Punch.filter((p) => p.project === project.alias);

  let duration = 0;
  let earnings = 0;
  let remainingDays = 0;
  let remainingWorkingDays = 0;
  let remainingTimeToTarget;
  let avgTimePerRemainingDay;

  const businessDays = project.businessDays;
  const interval = getInvoiceBounds(project.invoicePeriod);

  for (const punch of punches) {
    duration += punch.durationWithinInterval(interval);
    earnings += punch.payWithinInterval(interval);
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

  if (project.targetHours) {
    remainingTimeToTarget = project.targetHours * 60 * 60 * 1000 - duration;
    avgTimePerRemainingDay =
      remainingTimeToTarget / (remainingWorkingDays || 1);
  }

  return {
    duration,
    earnings,
    startDate: interval.start,
    endDate: interval.end,
    workingDays: project.businessDays,
    targetHours: project.targetHours,
    remainingDays,
    remainingWorkingDays,
    remainingTimeToTarget,
    avgTimePerRemainingDay,
  };
}

function getInvoiceBounds(config, referenceDate = new Date()) {
  let start;
  let end;

  const now = referenceDate;
  const date = now.getDate();

  switch (config.schedule.toLowerCase()) {
    case "monthly": {
      let value = config.endDate;

      if (typeof value === "string") {
        const str = config.endDate.toLowerCase().trim();

        if (str === "first") {
          value = 1;
        } else if (str === "last") {
          value = moment(now).subtract(1, "month").endOf("month").date();
        }
      }

      // Determine whether we're past the end and into the next month.
      if (date <= value) {
        end = moment(now).set("date", value).endOf("day").toDate();
      } else {
        end = moment(now)
          .set("date", value)
          .add(1, "month")
          .endOf("day")
          .toDate();
      }

      start = moment(end)
        .subtract(1, "month")
        .add(1, "day")
        .startOf("day")
        .toDate();
    }
  }

  return {
    start,
    end,
  };
}

module.exports = route;
