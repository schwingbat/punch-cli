const route = require("express").Router();
const moment = require("moment-timezone");
const differenceInDays = require("date-fns/differenceInDays");
const differenceInWeeks = require("date-fns/differenceInWeeks");
const { ascendingBy, descendingBy } = require("../../utils/sort-factories");

route.get("/", async function (req, res) {
  const { props } = req;
  const { config, Punch } = props;

  const currentPunches = await Punch.filter((punch) => punch.out == null);

  const current = {
    any: currentPunches.length > 0,
    punches: currentPunches.map((punch) => {
      return {
        ...punch,
        project: config.projects[punch.project],
      };
    }),
  };

  const today = moment().tz(config.display.timeZone);
  const yesterday = moment(today).subtract(1, "days");
  const lastWeek = moment(today).subtract(1, "weeks");
  const lastMonth = moment(today).subtract(1, "months");

  const endOfThisWeek = moment(today).endOf("week");
  const thisWeekIntervalEnd = endOfThisWeek > today ? today : endOfThisWeek;

  const endOfThisMonth = moment(today).endOf("month");
  const thisMonthIntervalEnd = endOfThisMonth > today ? today : endOfThisMonth;

  const thisWeekInterval = {
    start: moment(today).startOf("week").toDate(),
    end: thisWeekIntervalEnd.toDate(),
  };

  const lastWeekInterval = {
    start: moment(lastWeek).startOf("week").toDate(),
    end: moment(lastWeek).endOf("week").toDate(),
  };

  const thisMonthInterval = {
    start: moment(today).startOf("month").toDate(),
    end: thisMonthIntervalEnd.toDate(),
  };

  const lastMonthInterval = {
    start: moment(lastMonth).startOf("month").toDate(),
    end: moment(lastMonth).endOf("month").toDate(),
  };

  const summaries = {
    today: await getDaySummary(today, props),
    yesterday: await getDaySummary(yesterday, props),
    thisWeek: await getWeekSummary(thisWeekInterval, props),
    lastWeek: await getWeekSummary(lastWeekInterval, props),
    thisMonth: await getMonthSummary(thisMonthInterval, props),
    lastMonth: await getMonthSummary(lastMonthInterval, props),
  };

  res.render("sections/dashboard/index", {
    current,
    summaries,
  });
});

module.exports = route;

async function getDaySummary(date, { config, Punch }) {
  const interval = {
    start: moment(date).startOf("day").toDate(),
    end: moment(date).endOf("day").toDate(),
  };

  let duration = 0;
  let earnings = 0;

  const punches = await Punch.filter(
    (p) => p.durationWithinInterval(interval) > 0
  );

  for (const punch of punches) {
    duration += punch.durationWithinInterval(interval);
    earnings += punch.payWithinInterval(interval);
  }

  return {
    punches: punches.sort(ascendingBy("in")),
    duration,
    earnings,
    projects: getProjectsSummary(punches, interval, { config }),
  };
}

async function getWeekSummary(interval, { config, Punch }) {
  const punches = await Punch.filter(
    (p) => p.durationWithinInterval(interval) > 0
  );

  let duration = 0;
  let earnings = 0;

  for (const punch of punches) {
    duration += punch.durationWithinInterval(interval);
    earnings += punch.payWithinInterval(interval);
  }

  const totalDays = differenceInDays(interval.end, interval.start);

  return {
    duration,
    earnings,
    projects: getProjectsSummary(punches, interval, { config }),
    dailyAverage: {
      duration: duration / totalDays,
      earnings: earnings / totalDays,
    },
  };
}

async function getMonthSummary(interval, { config, Punch }) {
  const punches = await Punch.filter(
    (p) => p.durationWithinInterval(interval) > 0
  );

  let duration = 0;
  let earnings = 0;

  for (const punch of punches) {
    duration += punch.durationWithinInterval(interval);
    earnings += punch.payWithinInterval(interval);
  }

  const weeks = differenceInWeeks(interval.end, interval.start) || 1;

  return {
    duration,
    earnings,
    projects: getProjectsSummary(punches, interval, { config }),
    weeklyAverage: {
      duration: duration / weeks,
      earnings: earnings / weeks,
    },
  };
}

function getProjectsSummary(punches, interval, { config }) {
  const { projects } = config;

  const totals = {
    duration: 0,
    earnings: 0,
  };
  const byProject = {};

  for (const punch of punches) {
    if (!byProject[punch.project]) {
      byProject[punch.project] = {
        duration: 0,
        earnings: 0,
      };
    }

    const duration = punch.durationWithinInterval(interval);
    const earnings = punch.payWithinInterval(interval);

    byProject[punch.project].duration += duration;
    byProject[punch.project].earnings += earnings;

    totals.duration += duration;
    totals.earnings += earnings;
  }

  const projectArray = [];

  for (const alias in byProject) {
    const { duration, earnings } = byProject[alias];
    const { name, color } = projects[alias];

    const percentage = (duration / totals.duration) * 100;

    projectArray.push({
      name,
      color: getFallbackColor(color, projects[alias]),
      duration,
      earnings,
      percentage,
    });
  }

  return projectArray.sort(descendingBy("percentage"));
}

function getFallbackColor(color, project) {
  if (color) {
    return color;
  } else {
    // TODO: Generate consistent color based on project info.
    return "blue";
  }
}
